import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { environment } from '@/config/env';
import { sanitizeArtifactFilename } from '@/utils/artifacts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ArtifactDownloadRouteContext = {
  params: Promise<{ softwareModuleId: string; artifactId: string }>;
};

type ArtifactDetail = {
  providedFilename?: string;
  _links?: {
    download?: {
      href?: string;
    };
  };
};

const JSON_ERROR_STATUS = new Set([400, 401, 403, 404, 405, 409, 410, 422]);

const jsonError = (status: number, message: string) =>
  NextResponse.json(
    {
      exceptionClass: 'ArtifactDownloadError',
      errorCode: `httpStatus.${status}`,
      message,
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );

const resolveHawkbitAuth = async (request: NextRequest): Promise<string | undefined> => {
  const token = await getToken({ req: request });
  return token?.hawkbitAuth && typeof token.hawkbitAuth === 'string' ? token.hawkbitAuth : undefined;
};

const isNumericId = (value: string): boolean => /^\d+$/.test(value);

const upstreamErrorStatus = (status: number): number => (JSON_ERROR_STATUS.has(status) ? status : status >= 500 ? status : 502);

const buildDownloadResponse = (upstream: Response, artifact: ArtifactDetail) => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/octet-stream');
  headers.set('Content-Disposition', `attachment; filename="${sanitizeArtifactFilename(artifact.providedFilename)}"`);
  headers.set('Accept-Ranges', upstream.headers.get('accept-ranges') ?? 'bytes');
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');

  const contentEncoding = upstream.headers.get('content-encoding');
  const contentLength = upstream.headers.get('content-length');
  if (contentLength && !contentEncoding) {
    headers.set('Content-Length', contentLength);
  }

  const contentRange = upstream.headers.get('content-range');
  if (contentRange) {
    headers.set('Content-Range', contentRange);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
};

export async function GET(request: NextRequest, context: ArtifactDownloadRouteContext) {
  const auth = await resolveHawkbitAuth(request);
  if (!auth) {
    return jsonError(401, 'Unauthorized');
  }

  const { softwareModuleId, artifactId } = await context.params;
  if (!isNumericId(softwareModuleId) || !isNumericId(artifactId)) {
    return jsonError(404, 'Artifact not found');
  }

  const baseUrl = environment.hawkbitApiUrl;
  if (!baseUrl) {
    return jsonError(500, 'Artifact download is not configured');
  }

  let baseOrigin: string;
  try {
    baseOrigin = new URL(baseUrl).origin;
  } catch {
    return jsonError(500, 'Artifact download is not configured');
  }

  const authorization = `Basic ${auth}`;
  let artifact: ArtifactDetail;
  try {
    const detailResponse = await fetch(`${baseUrl}/rest/v1/softwaremodules/${softwareModuleId}/artifacts/${artifactId}`, {
      headers: {
        Authorization: authorization,
        Accept: 'application/hal+json',
      },
      cache: 'no-store',
      redirect: 'error',
    });

    if (!detailResponse.ok) {
      return jsonError(upstreamErrorStatus(detailResponse.status), detailResponse.status === 404 ? 'Artifact not found' : 'Failed to load artifact');
    }

    artifact = (await detailResponse.json()) as ArtifactDetail;
  } catch {
    return jsonError(500, 'Failed to load artifact');
  }

  const downloadHref = artifact._links?.download?.href;
  if (!downloadHref || typeof downloadHref !== 'string') {
    return jsonError(500, 'Artifact download link is missing');
  }

  let parsedDownloadHref: URL;
  try {
    parsedDownloadHref = new URL(downloadHref, baseUrl);
  } catch {
    return jsonError(500, 'Artifact download link is invalid');
  }

  if (parsedDownloadHref.protocol !== 'http:' && parsedDownloadHref.protocol !== 'https:') {
    return jsonError(500, 'Artifact download link is invalid');
  }

  if (parsedDownloadHref.origin !== baseOrigin) {
    return jsonError(502, 'Artifact download link is invalid');
  }

  const range = request.headers.get('range');
  const downloadHeaders: Record<string, string> = {
    Authorization: authorization,
    Accept: '*/*',
  };
  if (range) {
    downloadHeaders.Range = range;
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsedDownloadHref.toString(), {
      headers: downloadHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
  } catch {
    return jsonError(502, 'Failed to reach artifact storage');
  }

  if (!upstream.ok) {
    if (upstream.body) {
      await upstream.body.cancel().catch(() => undefined);
    }
    return jsonError(
      upstreamErrorStatus(upstream.status),
      upstream.status === 404
        ? 'Artifact not found'
        : upstream.status === 401 || upstream.status === 403
          ? 'Artifact access denied'
          : 'Failed to download artifact'
    );
  }

  return buildDownloadResponse(upstream, artifact);
}

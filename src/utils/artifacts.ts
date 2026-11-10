export const ARTIFACT_DOWNLOAD_ROUTE_PREFIX = '/api/softwaremodules';

export const buildArtifactDownloadPath = (softwareModuleId: number, artifactId: number): string =>
  `${ARTIFACT_DOWNLOAD_ROUTE_PREFIX}/${softwareModuleId}/artifacts/${artifactId}/download`;

export const formatArtifactSize = (size: number | null | undefined): string => {
  if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) {
    return 'Unknown size';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]} (${size.toLocaleString('en-US')} B)`;
};

export const sanitizeArtifactFilename = (filename: string | null | undefined): string => {
  const fallback = 'artifact.bin';
  if (!filename) {
    return fallback;
  }

  const sanitized = filename
    .replace(/[\r\n"]/g, '')
    .replace(/[\\/]/g, '_')
    .trim();

  return sanitized === '' ? fallback : sanitized;
};

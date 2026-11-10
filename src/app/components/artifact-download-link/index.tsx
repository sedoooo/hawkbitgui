'use client';

import DownloadIcon from '../icons/download-icon';
import Tooltip from '../tooltip';
import { buildArtifactDownloadPath } from '@/utils/artifacts';

interface ArtifactDownloadLinkProps {
  softwareModuleId: number;
  artifactId: number;
  filename: string;
}

export default function ArtifactDownloadLink({ softwareModuleId, artifactId, filename }: ArtifactDownloadLinkProps) {
  const href = buildArtifactDownloadPath(softwareModuleId, artifactId);

  return (
    <Tooltip content='Download'>
      <a
        href={href}
        download={filename}
        aria-label={`Download ${filename}`}
        data-testid={`artifact-download-${artifactId}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#898B90', cursor: 'pointer' }}
      >
        <DownloadIcon width={20} height={20} />
      </a>
    </Tooltip>
  );
}

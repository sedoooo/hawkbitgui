'use client';

import Text from '@/app/components/text';
import ArtifactDownloadLink from '@/app/components/artifact-download-link';
import ActionIconButtons from '@/app/components/action-icon-buttons';
import { SoftwareModuleArtifact } from '@/entities/software-module-artifact';
import { formatArtifactSize } from '@/utils/artifacts';
import styles from './styles.module.scss';

interface ArtifactListProps {
  softwareModuleId: number;
  artifacts: SoftwareModuleArtifact[];
  isLoading?: boolean;
  emptyText?: string;
}

export default function ArtifactList({
  softwareModuleId,
  artifacts,
  isLoading = false,
  emptyText = 'No artifacts uploaded for this software module.',
}: ArtifactListProps) {
  if (isLoading) {
    return <Text variant='paragraph-sm'>Loading artifacts...</Text>;
  }

  if (artifacts.length === 0) {
    return <Text variant='paragraph-sm'>{emptyText}</Text>;
  }

  return (
    <div className={styles.list} data-testid='artifact-list'>
      <div className={styles.header}>
        <span className={styles.filename}>File name</span>
        <span className={styles.size}>Size</span>
        <span className={styles.hashes}>Hashes</span>
        <span className={styles.actions}>Download</span>
      </div>
      {artifacts.map((artifact) => {
        const hashes = artifact.hashes;
        const hashTitle = [
          hashes?.sha256 ? `SHA256: ${hashes.sha256}` : undefined,
          hashes?.sha1 ? `SHA1: ${hashes.sha1}` : undefined,
          hashes?.md5 ? `MD5: ${hashes.md5}` : undefined,
        ]
          .filter(Boolean)
          .join('\n');

        return (
          <div className={styles.row} key={artifact.id} data-testid={`artifact-row-${artifact.id}`}>
            <span className={styles.filename} title={artifact.providedFilename}>
              {artifact.providedFilename}
            </span>
            <span className={styles.size} title={`${artifact.size} bytes`}>
              {formatArtifactSize(artifact.size)}
            </span>
            <span className={styles.hashes} title={hashTitle} data-testid={`artifact-hashes-${artifact.id}`}>
              <span className={styles.hashLine}>SHA256 {hashes?.sha256 ?? '—'}</span>
              <span className={styles.hashLineMuted}>SHA1 {hashes?.sha1 ?? '—'}</span>
              <span className={styles.hashLineMuted}>MD5 {hashes?.md5 ?? '—'}</span>
            </span>
            <span className={styles.actions}>
              <ActionIconButtons>
                <ArtifactDownloadLink softwareModuleId={softwareModuleId} artifactId={artifact.id} filename={artifact.providedFilename} />
              </ActionIconButtons>
            </span>
          </div>
        );
      })}
    </div>
  );
}

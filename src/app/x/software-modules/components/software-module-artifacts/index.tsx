'use client';

import ArtifactList from '@/app/components/artifact-list';
import Text from '@/app/components/text';
import { useGetArtifacts } from '@/app/x/upload/hooks/use-get-artifacts';

export default function SoftwareModuleArtifacts({ softwareModuleId }: { softwareModuleId: number }) {
  const { data: artifacts, isLoading, error } = useGetArtifacts({ softwareModuleId });

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', padding: '12px 16px' }}
      data-testid={`software-module-artifacts-${softwareModuleId}`}
    >
      <Text variant='heading-3'>Artifacts</Text>
      {error ? (
        <Text variant='paragraph-sm'>Unable to load artifacts for this software module.</Text>
      ) : (
        <ArtifactList softwareModuleId={softwareModuleId} artifacts={artifacts ?? []} isLoading={isLoading} />
      )}
    </div>
  );
}

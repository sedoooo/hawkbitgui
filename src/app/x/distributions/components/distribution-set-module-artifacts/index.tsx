'use client';

import ArtifactList from '@/app/components/artifact-list';
import { useGetArtifacts } from '@/app/x/upload/hooks/use-get-artifacts';

export default function DistributionSetModuleArtifacts({ softwareModuleId }: { softwareModuleId: number }) {
  const { data: artifacts, isLoading } = useGetArtifacts({ softwareModuleId });

  return (
    <div style={{ width: '100%', padding: '12px 16px' }} data-testid={`distribution-set-module-artifacts-${softwareModuleId}`}>
      <ArtifactList softwareModuleId={softwareModuleId} artifacts={artifacts ?? []} isLoading={isLoading} emptyText='No artifacts uploaded for this module.' />
    </div>
  );
}

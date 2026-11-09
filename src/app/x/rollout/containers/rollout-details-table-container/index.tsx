'use client';

import { useRolloutsPageStore } from '@/stores/rollouts-page-store';
import RolloutDetailsTable from '../../components/rollout-details-table';
import { useGetRolloutDeployGroups } from '../../hooks/use-get-rollout-deploy-groups';
import { RolloutDeployGroup } from '@/entities/rollout';
import { useRolloutDeployGroupsTableStore } from '@/stores/rollout-deploy-groups-table-store';

export default function RolloutDetailsTableContainer() {
  const selectedRollout = useRolloutsPageStore((state) => state.selectedRollout);

  const setTableType = useRolloutsPageStore((state) => state.setTableType);
  const visibleColumns = useRolloutDeployGroupsTableStore((state) => state.visibleColumns);

  const { data: rolloutDeployGroups, isLoading } = useGetRolloutDeployGroups({
    rolloutId: selectedRollout?.id ?? 0,
    queryOptions: {
      enabled: !!selectedRollout,
    },
  });

  const handleNameClick = (rolloutDeployGroup: RolloutDeployGroup) => {
    setTableType({ tableType: 'deploy-group-targets', selectedDeployGroup: rolloutDeployGroup });
  };

  return <RolloutDetailsTable deployGroups={rolloutDeployGroups ?? []} isLoading={isLoading} onNameClick={handleNameClick} visibleColumns={visibleColumns} />;
}

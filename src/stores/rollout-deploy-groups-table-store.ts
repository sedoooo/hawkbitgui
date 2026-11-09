import { create } from 'zustand';
import { RolloutDeployGroup } from '@/entities/rollout';
import { VisibleColumn } from '@/types/utils/visible-column';
import { getColumnVisibilityStorageKey } from '@/utils/columns-visibility';

export type RolloutDeployGroupsTableColumnKey = keyof RolloutDeployGroup | 'finished';

export const ROLLOUT_DEPLOY_GROUPS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY = getColumnVisibilityStorageKey('rollout-deploy-groups-table');

export const DEFAULT_ROLLOUT_DEPLOY_GROUPS_TABLE_VISIBLE_COLUMNS: Partial<Record<RolloutDeployGroupsTableColumnKey, VisibleColumn>> = {
  name: {
    id: 'name',
    label: 'Name',
    isSelected: true,
  },
  status: {
    id: 'status',
    label: 'Status',
    isSelected: true,
  },
  totalTargetsPerStatus: {
    id: 'totalTargetsPerStatus',
    label: 'Detail status',
    isSelected: true,
  },
  totalTargets: {
    id: 'totalTargets',
    label: 'Targets',
    isSelected: true,
  },
  finished: {
    id: 'finished',
    label: 'Finished',
    isSelected: true,
  },
  errorCondition: {
    id: 'errorCondition',
    label: 'Error threshold',
    isSelected: true,
  },
  successCondition: {
    id: 'successCondition',
    label: 'Trigger threshold',
    isSelected: true,
  },
  createdBy: {
    id: 'createdBy',
    label: 'Created by',
    isSelected: true,
  },
  createdAt: {
    id: 'createdAt',
    label: 'Created at',
    isSelected: true,
  },
};

interface RolloutDeployGroupsTableState {
  visibleColumns: Partial<Record<RolloutDeployGroupsTableColumnKey, VisibleColumn>>;
  setVisibleColumns: (columns: Record<string, VisibleColumn>) => void;
}

export const useRolloutDeployGroupsTableStore = create<RolloutDeployGroupsTableState>((set) => ({
  visibleColumns: DEFAULT_ROLLOUT_DEPLOY_GROUPS_TABLE_VISIBLE_COLUMNS,
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),
}));

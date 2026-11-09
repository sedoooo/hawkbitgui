import { create } from 'zustand';
import { DeployGroupTarget } from '@/entities/rollout';
import { VisibleColumn } from '@/types/utils/visible-column';
import { getColumnVisibilityStorageKey } from '@/utils/columns-visibility';

export type RolloutDeployGroupTargetsTableColumnKey = keyof DeployGroupTarget;

export const ROLLOUT_DEPLOY_GROUP_TARGETS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY = getColumnVisibilityStorageKey('rollout-deploy-group-targets-table');

export const DEFAULT_ROLLOUT_DEPLOY_GROUP_TARGETS_TABLE_VISIBLE_COLUMNS: Partial<Record<RolloutDeployGroupTargetsTableColumnKey, VisibleColumn>> = {
  controllerId: {
    id: 'controllerId',
    label: 'Target Id (Controller ID)',
    isSelected: true,
  },
  name: {
    id: 'name',
    label: 'Name',
    isSelected: true,
  },
  description: {
    id: 'description',
    label: 'Description',
    isSelected: true,
  },
  updateStatus: {
    id: 'updateStatus',
    label: 'Status',
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
  lastModifiedBy: {
    id: 'lastModifiedBy',
    label: 'Last modified by',
    isSelected: true,
  },
  lastModifiedAt: {
    id: 'lastModifiedAt',
    label: 'Last modified at',
    isSelected: true,
  },
};

interface RolloutDeployGroupTargetsTableState {
  visibleColumns: Partial<Record<RolloutDeployGroupTargetsTableColumnKey, VisibleColumn>>;
  setVisibleColumns: (columns: Record<string, VisibleColumn>) => void;
}

export const useRolloutDeployGroupTargetsTableStore = create<RolloutDeployGroupTargetsTableState>((set) => ({
  visibleColumns: DEFAULT_ROLLOUT_DEPLOY_GROUP_TARGETS_TABLE_VISIBLE_COLUMNS,
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),
}));

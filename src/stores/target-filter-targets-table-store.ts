import { create } from 'zustand';
import { Target } from '@/entities';
import { VisibleColumn } from '@/types/utils/visible-column';
import { getColumnVisibilityStorageKey } from '@/utils/columns-visibility';

export type TargetFilterTargetsTableColumnKey = keyof Target;

export const TARGET_FILTER_TARGETS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY = getColumnVisibilityStorageKey('target-filter-targets-table');

export const DEFAULT_TARGET_FILTER_TARGETS_TABLE_VISIBLE_COLUMNS: Partial<Record<TargetFilterTargetsTableColumnKey, VisibleColumn>> = {
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
    label: 'Created Date',
    isSelected: true,
  },
  lastModifiedBy: {
    id: 'lastModifiedBy',
    label: 'Modified by',
    isSelected: true,
  },
  lastModifiedAt: {
    id: 'lastModifiedAt',
    label: 'Modified Date',
    isSelected: true,
  },
};

interface TargetFilterTargetsTableState {
  visibleColumns: Partial<Record<TargetFilterTargetsTableColumnKey, VisibleColumn>>;
  setVisibleColumns: (columns: Record<string, VisibleColumn>) => void;
}

export const useTargetFilterTargetsTableStore = create<TargetFilterTargetsTableState>((set) => ({
  visibleColumns: DEFAULT_TARGET_FILTER_TARGETS_TABLE_VISIBLE_COLUMNS,
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),
}));

import { getColumnVisibilityStorageKey } from '@/utils/columns-visibility';
import { VisibleColumn } from '@/types/utils/visible-column';

export type TargetTypeColumnKey = 'name' | 'key' | 'description' | 'compatibleDistributionSetTypes' | 'targetCount' | 'actions';

export const TARGET_TYPES_TABLE_VISIBLE_COLUMNS_STORAGE_KEY = getColumnVisibilityStorageKey('target-types-table');

export const DEFAULT_TARGET_TYPES_TABLE_VISIBLE_COLUMNS: Record<TargetTypeColumnKey, VisibleColumn> = {
  name: {
    id: 'name',
    label: 'Name',
    isSelected: true,
  },
  key: {
    id: 'key',
    label: 'Key',
    isSelected: true,
  },
  description: {
    id: 'description',
    label: 'Description',
    isSelected: true,
  },
  compatibleDistributionSetTypes: {
    id: 'compatibleDistributionSetTypes',
    label: 'Compatible DS Types',
    isSelected: true,
  },
  targetCount: {
    id: 'targetCount',
    label: 'Targets',
    isSelected: true,
  },
  actions: {
    id: 'actions',
    label: 'Actions',
    isSelected: true,
  },
};

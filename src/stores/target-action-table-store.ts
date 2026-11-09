import { create } from 'zustand';
import { TargetAction } from '@/entities/target-action';
import { TargetsService } from '@/services/targets-service';
import { DistributionSetsService } from '@/services/distribution-sets-service';
import { VisibleColumn } from '@/types/utils/visible-column';
import { getColumnVisibilityStorageKey } from '@/utils/columns-visibility';
import { applyDistributionSetTypes, getActionDistributionSetId } from '@/utils/distribution-set';
import { resolveDistributionSetType } from '@/utils/table-display';

const distributionSetTypeById = new Map<number, string>();
const distributionSetTypeLookupAttempted = new Set<number>();

async function enrichActionsWithDistributionSetTypes(actions: TargetAction[]): Promise<TargetAction[]> {
  const missingDistributionSetIds = Array.from(new Set(actions.map(getActionDistributionSetId).filter((id): id is number => id !== undefined))).filter(
    (id) => !distributionSetTypeById.has(id) && !distributionSetTypeLookupAttempted.has(id)
  );

  if (missingDistributionSetIds.length > 0) {
    try {
      const { distributionSets } = await DistributionSetsService.fetchDistributionSets(undefined, { offset: 0, limit: 1000 });
      distributionSets.forEach((distributionSet) => {
        distributionSetTypeById.set(distributionSet.id, resolveDistributionSetType(distributionSet));
      });
      missingDistributionSetIds.forEach((id) => distributionSetTypeLookupAttempted.add(id));
    } catch (error) {
      console.error('Failed to resolve distribution set types', error);
    }
  }

  return applyDistributionSetTypes(actions, distributionSetTypeById);
}

export type TargetActionsTableColumnKey = keyof TargetAction | '_links.distributionset.name' | 'actions';

export const TARGET_ACTIONS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY = getColumnVisibilityStorageKey('deployment-action-history-table');

export const DEFAULT_TARGET_ACTIONS_TABLE_VISIBLE_COLUMNS: Partial<Record<TargetActionsTableColumnKey, VisibleColumn>> = {
  status: {
    id: 'status',
    label: 'Status',
    isSelected: true,
  },
  id: {
    id: 'id',
    label: 'Action Id',
    isSelected: true,
  },
  rolloutName: {
    id: 'rolloutName',
    label: 'Rollout Name',
    isSelected: true,
  },
  type: {
    id: 'type',
    label: 'Type',
    isSelected: true,
  },
  '_links.distributionset.name': {
    id: '_links.distributionset.name',
    label: 'Distribution Set',
    isSelected: false,
  },
  distributionSetType: {
    id: 'distributionSetType',
    label: 'Distribution Set Type',
    isSelected: true,
  },
  createdAt: {
    id: 'createdAt',
    label: 'Created Date',
    isSelected: false,
  },
  createdBy: {
    id: 'createdBy',
    label: 'Created By',
    isSelected: false,
  },
  lastModifiedAt: {
    id: 'lastModifiedAt',
    label: 'Modified Date',
    isSelected: false,
  },
  lastModifiedBy: {
    id: 'lastModifiedBy',
    label: 'Modified By',
    isSelected: false,
  },
  actions: {
    id: 'actions',
    label: 'Actions',
    isSelected: true,
  },
};

interface TargetActionsTableState {
  selectedTargetId?: string;
  actions: TargetAction[];
  isExpanded: boolean;
  isLoading: boolean;
  selectedAction?: TargetAction;
  visibleColumns: Partial<Record<TargetActionsTableColumnKey, VisibleColumn>>;
  setSelectedAction: (action: TargetAction) => void;
  resetSelectedAction: () => void;
  setActions: (actions: TargetAction[]) => void;
  resetActions: () => void;
  setIsExpanded: (isExpanded: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setVisibleColumns: (columns: Record<string, VisibleColumn>) => void;
  fetchActions: (controllerId: string) => Promise<void>;
  pollActions: (controllerId: string) => Promise<void>;
  setSelectedTargetId: (targetId: string) => void;
}

export const useTargetActionsTableStore = create<TargetActionsTableState>((set) => ({
  actions: [],
  selectedTargetId: undefined,
  isExpanded: false,
  isLoading: false,
  selectedAction: undefined,
  visibleColumns: DEFAULT_TARGET_ACTIONS_TABLE_VISIBLE_COLUMNS,
  setSelectedAction: (action) => set({ selectedAction: action }),
  resetSelectedAction: () => set({ selectedAction: undefined }),
  setActions: (actions) => set({ actions }),
  resetActions: () => set({ actions: [] }),
  setIsExpanded: (isExpanded) => set({ isExpanded }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),
  setSelectedTargetId: (targetId) => set({ selectedTargetId: targetId }),
  fetchActions: async (controllerId: string) => {
    set({ isLoading: true });
    try {
      const targetActions = await enrichActionsWithDistributionSetTypes(await TargetsService.fetchActions(controllerId));
      set({ actions: targetActions });
    } catch (error) {
      console.error('Failed to fetch target actions', error);
    } finally {
      set({ isLoading: false });
    }
  },
  pollActions: async (controllerId: string) => {
    try {
      const targetActions = await enrichActionsWithDistributionSetTypes(await TargetsService.fetchActions(controllerId));
      set({ actions: targetActions });
    } catch (error) {
      console.error('Failed to poll target actions', error);
    }
  },
}));

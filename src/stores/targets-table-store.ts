import { create } from 'zustand';
import { Target } from '@/entities';
import { TargetsService } from '@/services/targets-service';
import { useTargetsFiltersStore } from '@/stores/targets-filters-store';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { VisibleColumn } from '@/types/utils/visible-column';
import { getColumnVisibilityStorageKey } from '@/utils/columns-visibility';

export type TargetsTableColumnKey = keyof Target | 'actions';

export const TARGETS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY = getColumnVisibilityStorageKey('deployment-targets-table');

export const DEFAULT_TARGETS_TABLE_VISIBLE_COLUMNS: Partial<Record<TargetsTableColumnKey, VisibleColumn>> = {
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
  updateStatus: {
    id: 'updateStatus',
    label: 'Status',
    isSelected: true,
  },
  actions: {
    id: 'actions',
    label: 'Actions',
    isSelected: true,
  },
};

interface TargetsTableState {
  targets: Target[];
  filteredTargets: Target[];
  isExpanded: boolean;
  isLoading: boolean;
  selectedTarget?: Target;
  page: number;
  size: number;
  total: number;
  visibleColumns: Partial<Record<TargetsTableColumnKey, VisibleColumn>>;
  setPage: (page: number) => void;
  setTotal: (total: number) => void;
  setSelectedTarget: (target: Target) => void;
  setFilteredTargets: (filteredTargets: Target[]) => void;
  resetSelectedTarget: () => void;
  setTargets: (targets: Target[]) => void;
  resetTargets: () => void;
  setIsExpanded: (isExpanded: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setVisibleColumns: (columns: Record<string, VisibleColumn>) => void;
  fetchTargets: () => Promise<void>;
  pollTargets: () => Promise<void>;
}

export const useTargetsTableStore = create<TargetsTableState>((set) => ({
  targets: [],
  filteredTargets: [],
  isExpanded: false,
  isLoading: false,
  selectedTarget: undefined,
  page: 0,
  size: DEFAULT_PAGE_SIZE,
  total: 0,
  visibleColumns: DEFAULT_TARGETS_TABLE_VISIBLE_COLUMNS,
  setPage: (page) => set({ page }),
  setTotal: (total: number) => set({ total }),
  setSelectedTarget: (target) => set({ selectedTarget: target }),
  setFilteredTargets: (filteredTargets) => set({ filteredTargets }),
  resetSelectedTarget: () => set({ selectedTarget: undefined }),
  setTargets: (targets) => set({ targets, filteredTargets: targets }),
  resetTargets: () => set({ targets: [], filteredTargets: [] }),
  setIsExpanded: (isExpanded) => set({ isExpanded }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),

  fetchTargets: async () => {
    set({ isLoading: true });
    try {
      const filters = useTargetsFiltersStore.getState().filters;
      const { page, size } = useTargetsTableStore.getState();
      const { targets, totalTargets } = await TargetsService.fetchTargets({
        filters: Object.values(filters),
        queryParams: { offset: page * size, limit: size, sort: 'name:ASC' },
      });
      set({ targets, filteredTargets: targets, total: totalTargets });
    } catch (error) {
      console.error('Failed to fetch targets', error);
    } finally {
      set({ isLoading: false });
    }
  },

  pollTargets: async () => {
    try {
      const filters = useTargetsFiltersStore.getState().filters;
      const { page, size } = useTargetsTableStore.getState();
      const { targets, totalTargets } = await TargetsService.fetchTargets({
        filters: Object.values(filters),
        queryParams: { offset: page * size, limit: size, sort: 'name:ASC' },
      });
      set({ targets, filteredTargets: targets, total: totalTargets });
    } catch (error) {
      console.error('Failed to poll targets', error);
    }
  },
}));

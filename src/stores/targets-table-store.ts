import { create, type StoreApi } from 'zustand';
import type { SortingState } from '@tanstack/react-table';
import { Target } from '@/entities';
import { TargetsService } from '@/services/targets-service';
import { useTargetsFiltersStore } from '@/stores/targets-filters-store';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { VisibleColumn } from '@/types/utils/visible-column';
import { getColumnVisibilityStorageKey } from '@/utils/columns-visibility';
import { TARGETS_SERVER_SORT } from '@/utils/table-sort-maps';
import { computeSort, GLOBAL_SORT_MAX_ROWS, paginateRows, sortRowsClientSide } from '@/utils/global-sort';

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
  sorting: SortingState;
  visibleColumns: Partial<Record<TargetsTableColumnKey, VisibleColumn>>;
  setPage: (page: number) => void;
  setSorting: (sorting: SortingState) => void;
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
  sorting: [],
  visibleColumns: DEFAULT_TARGETS_TABLE_VISIBLE_COLUMNS,
  setPage: (page) => set({ page }),
  setSorting: (sorting) => set({ sorting, page: 0 }),
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
      await fetchTargetsPage(set);
    } catch (error) {
      console.error('Failed to fetch targets', error);
    } finally {
      set({ isLoading: false });
    }
  },

  pollTargets: async () => {
    try {
      await fetchTargetsPage(set);
    } catch (error) {
      console.error('Failed to poll targets', error);
    }
  },
}));

type TargetsStoreSet = StoreApi<TargetsTableState>['setState'];

async function fetchTargetsPage(set: TargetsStoreSet) {
  const filters = useTargetsFiltersStore.getState().filters;
  const { page, size, sorting } = useTargetsTableStore.getState();
  const { serverSort, isClient, activeSort } = computeSort(sorting, TARGETS_SERVER_SORT, 'name:ASC');

  if (isClient) {
    const { targets, totalTargets } = await TargetsService.fetchTargets({
      filters: Object.values(filters),
      queryParams: { offset: 0, limit: GLOBAL_SORT_MAX_ROWS },
    });
    if (totalTargets > GLOBAL_SORT_MAX_ROWS) {
      console.warn(`Client-side target sort truncated to ${GLOBAL_SORT_MAX_ROWS} of ${totalTargets} rows`);
    }
    const sorted = sortRowsClientSide(targets, activeSort);
    const paged = paginateRows(sorted, page, size);
    set({ targets: paged, filteredTargets: paged, total: sorted.length });
    return;
  }

  const { targets, totalTargets } = await TargetsService.fetchTargets({
    filters: Object.values(filters),
    queryParams: { offset: page * size, limit: size, sort: serverSort },
  });
  set({ targets, filteredTargets: targets, total: totalTargets });
}

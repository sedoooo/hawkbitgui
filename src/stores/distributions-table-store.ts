import { create, type StoreApi } from 'zustand';
import type { SortingState } from '@tanstack/react-table';
import { Distribution } from '@/entities';
import { DistributionSetsService } from '@/services/distribution-sets-service';
import { useDistributionsFiltersStore } from '@/stores/distributions-filters-store';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { VisibleColumn } from '@/types/utils/visible-column';
import { getColumnVisibilityStorageKey } from '@/utils/columns-visibility';
import { DISTRIBUTION_SETS_SERVER_SORT } from '@/utils/table-sort-maps';
import { computeSort, GLOBAL_SORT_MAX_ROWS, paginateRows, sortRowsClientSide } from '@/utils/global-sort';

export type DistributionsTableColumnKey = keyof Distribution | 'actions';

export const DISTRIBUTIONS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY = getColumnVisibilityStorageKey('deployment-distributions-table');

export const DEFAULT_DISTRIBUTIONS_TABLE_VISIBLE_COLUMNS: Partial<Record<DistributionsTableColumnKey, VisibleColumn>> = {
  name: {
    id: 'name',
    label: 'Name',
    isSelected: true,
  },
  version: {
    id: 'version',
    label: 'Version',
    isSelected: true,
  },
  description: {
    id: 'description',
    label: 'Description',
    isSelected: false,
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

interface DistributionsTableState {
  distributions: Distribution[];
  filteredDistributions: Distribution[];
  isExpanded: boolean;
  isLoading: boolean;
  selectedDistribution?: Distribution;
  page: number;
  size: number;
  total: number;
  sorting: SortingState;
  visibleColumns: Partial<Record<DistributionsTableColumnKey, VisibleColumn>>;
  setPage: (page: number) => void;
  setSorting: (sorting: SortingState) => void;
  setTotal: (total: number) => void;
  setSelectedDistribution: (distribution: Distribution) => void;
  setFilteredDistributions: (filtered: Distribution[]) => void;
  resetSelectedDistribution: () => void;
  setDistributions: (distributions: Distribution[]) => void;
  resetDistributions: () => void;
  setIsExpanded: (isExpanded: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setVisibleColumns: (columns: Record<string, VisibleColumn>) => void;
  fetchDistributions: () => Promise<void>;
  pollDistributions: () => Promise<void>;
}

export const useDistributionsTableStore = create<DistributionsTableState>((set) => ({
  distributions: [],
  filteredDistributions: [],
  isExpanded: false,
  isLoading: false,
  selectedDistribution: undefined,
  page: 0,
  size: DEFAULT_PAGE_SIZE,
  total: 0,
  sorting: [],
  visibleColumns: DEFAULT_DISTRIBUTIONS_TABLE_VISIBLE_COLUMNS,
  setPage: (page) => set({ page }),
  setSorting: (sorting) => set({ sorting, page: 0 }),
  setTotal: (total) => set({ total }),
  setSelectedDistribution: (distribution) => set({ selectedDistribution: distribution }),
  setFilteredDistributions: (filtered) => set({ filteredDistributions: filtered }),
  resetSelectedDistribution: () => set({ selectedDistribution: undefined }),
  setDistributions: (distributions) => set({ distributions, filteredDistributions: distributions }),
  resetDistributions: () => set({ distributions: [], filteredDistributions: [] }),
  setIsExpanded: (isExpanded) => set({ isExpanded }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),
  fetchDistributions: async () => {
    set({ isLoading: true });
    try {
      await fetchDistributionsPage(set);
    } catch (error) {
      console.error('Failed to fetch distributions', error);
    } finally {
      set({ isLoading: false });
    }
  },
  pollDistributions: async () => {
    try {
      await fetchDistributionsPage(set);
    } catch (error) {
      console.error('Failed to poll distributions', error);
    }
  },
}));

type DistributionsStoreSet = StoreApi<DistributionsTableState>['setState'];

async function fetchDistributionsPage(set: DistributionsStoreSet) {
  const filters = useDistributionsFiltersStore.getState().filters;
  const { page, size, sorting } = useDistributionsTableStore.getState();
  const { serverSort, isClient, activeSort } = computeSort(sorting, DISTRIBUTION_SETS_SERVER_SORT, 'name:ASC');

  if (isClient) {
    const { distributionSets, totalDistributionSets } = await DistributionSetsService.fetchDistributionSets(
      { filters: Object.values(filters) },
      { offset: 0, limit: GLOBAL_SORT_MAX_ROWS }
    );
    if (totalDistributionSets > GLOBAL_SORT_MAX_ROWS) {
      console.warn(`Client-side distribution sort truncated to ${GLOBAL_SORT_MAX_ROWS} of ${totalDistributionSets} rows`);
    }
    const sorted = sortRowsClientSide(distributionSets, activeSort);
    const paged = paginateRows(sorted, page, size);
    set({ distributions: paged, filteredDistributions: paged, total: sorted.length });
    return;
  }

  const { distributionSets, totalDistributionSets } = await DistributionSetsService.fetchDistributionSets(
    { filters: Object.values(filters) },
    { offset: page * size, limit: size, sort: serverSort }
  );
  set({ distributions: distributionSets, filteredDistributions: distributionSets, total: totalDistributionSets });
}

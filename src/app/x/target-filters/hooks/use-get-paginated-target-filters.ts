import { TargetFilter } from '@/entities/target-filter';
import { TargetFiltersService } from '@/services/target-filters-service';
import { useTargetFiltersTableStore } from '@/stores/target-filters-table-store';
import { ApiError } from '@/types/hawkbit-api/error';
import type { SortingState } from '@tanstack/react-table';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { TARGET_FILTERS_SERVER_SORT } from '@/utils/table-sort-maps';
import { computeSort, GLOBAL_SORT_MAX_ROWS, paginateRows, sortRowsClientSide } from '@/utils/global-sort';

type UseGetPaginatedTargetFiltersOutput = {
  targetFilters: TargetFilter[];
  totalTargetFilters: number;
};

type UseGetPaginatedTargetFiltersParams = {
  sorting?: SortingState;
  queryOptions?: Omit<UseQueryOptions<UseGetPaginatedTargetFiltersOutput, ApiError, UseGetPaginatedTargetFiltersOutput>, 'queryKey' | 'queryFn'>;
};

export const useGetPaginatedTargetFilters = (params?: UseGetPaginatedTargetFiltersParams) => {
  const { sorting = [], queryOptions } = params ?? {};

  const page = useTargetFiltersTableStore((state) => state.page);
  const size = useTargetFiltersTableStore((state) => state.size);
  const searchQuery = useTargetFiltersTableStore((state) => state.searchQuery);
  const escapedSearchQuery = searchQuery?.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
  const fiqlSearchQuery = escapedSearchQuery ? `name=="*${escapedSearchQuery}*"` : undefined;

  const { serverSort, isClient, activeSort } = computeSort(sorting, TARGET_FILTERS_SERVER_SORT, 'name:ASC');

  const queryKey = ['target-filters', page, size, fiqlSearchQuery, serverSort ?? 'client', activeSort?.columnId, activeSort?.direction];

  const { data, isLoading, error, refetch } = useQuery<UseGetPaginatedTargetFiltersOutput, ApiError>({
    queryKey,
    queryFn: async () => {
      if (isClient) {
        const { targetFilters, totalTargetFilters } = await TargetFiltersService.fetchTargetFilters({
          queryParams: { q: fiqlSearchQuery, offset: 0, limit: GLOBAL_SORT_MAX_ROWS },
        });
        if (totalTargetFilters > GLOBAL_SORT_MAX_ROWS) {
          console.warn(`Client-side target filter sort truncated to ${GLOBAL_SORT_MAX_ROWS} of ${totalTargetFilters} rows`);
        }
        const sorted = sortRowsClientSide(targetFilters, activeSort);
        return { targetFilters: paginateRows(sorted, page, size), totalTargetFilters: sorted.length };
      }

      return TargetFiltersService.fetchTargetFilters({
        queryParams: { q: fiqlSearchQuery, offset: page * size, limit: size, sort: serverSort },
      });
    },
    ...queryOptions,
  });

  return { data, isLoading, error, refetch };
};

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { ApiError } from '@/types/hawkbit-api/error';
import { TargetsService } from '@/services/targets-service';
import { Target } from '@/entities';
import { useTargetsTableStore } from '@/stores/targets-table-store';
import { TARGETS_SERVER_SORT } from '@/utils/table-sort-maps';
import { computeSort, GLOBAL_SORT_MAX_ROWS, paginateRows, sortRowsClientSide } from '@/utils/global-sort';

type UseGetPaginatedTargetsOutput = {
  targets: Target[];
  totalTargets: number;
};

interface TargetsQueryParams {
  q?: string;
}

type UseGetPaginatedTargetsParams = {
  queryParams?: TargetsQueryParams;
  sorting?: SortingState;
  queryOptions?: Omit<UseQueryOptions<UseGetPaginatedTargetsOutput, ApiError, UseGetPaginatedTargetsOutput>, 'queryKey' | 'queryFn'>;
};

export const useGetPaginatedTargets = (params?: UseGetPaginatedTargetsParams) => {
  const { queryParams = {}, sorting = [], queryOptions } = params ?? {};

  const page = useTargetsTableStore((state) => state.page);
  const size = useTargetsTableStore((state) => state.size);

  const { serverSort, isClient, activeSort } = computeSort(sorting, TARGETS_SERVER_SORT, 'name:ASC');

  const { data, isLoading, error, refetch } = useQuery<UseGetPaginatedTargetsOutput, ApiError>({
    queryKey: ['targets', queryParams.q, page, size, serverSort ?? 'client', activeSort?.columnId, activeSort?.direction],
    queryFn: async () => {
      if (isClient) {
        const { targets, totalTargets } = await TargetsService.fetchTargets({
          queryParams: { query: queryParams.q, offset: 0, limit: GLOBAL_SORT_MAX_ROWS },
          filters: [],
        });
        if (totalTargets > GLOBAL_SORT_MAX_ROWS) {
          console.warn(`Client-side target sort truncated to ${GLOBAL_SORT_MAX_ROWS} of ${totalTargets} rows`);
        }
        const sorted = sortRowsClientSide(targets, activeSort);
        return { targets: paginateRows(sorted, page, size), totalTargets: sorted.length };
      }

      return TargetsService.fetchTargets({ queryParams: { query: queryParams.q, offset: page * size, limit: size, sort: serverSort }, filters: [] });
    },
    ...queryOptions,
  });

  return { data, isLoading, error, refetch };
};

import { Rollout } from '@/entities/rollout';
import { RolloutsQueryParams, RolloutsService } from '@/services/rollouts-service';
import { Representation } from '@/services/shared';
import { useRolloutsTableStore } from '@/stores/rollouts-table-store';
import { ApiError } from '@/types/hawkbit-api/error';
import type { SortingState } from '@tanstack/react-table';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ROLLOUTS_SERVER_SORT } from '@/utils/table-sort-maps';
import { computeSort, GLOBAL_SORT_MAX_ROWS, paginateRows, sortRowsClientSide } from '@/utils/global-sort';

const DEFAULT_QUERY_PARAMS: RolloutsQueryParams = { representation: Representation.FULL };

export type UseGetPaginatedRolloutsOutput = {
  rollouts: Rollout[];
  totalRollouts: number;
};

type UseGetPaginatedRolloutsParams = {
  queryParams?: RolloutsQueryParams; // query params are not going to retrigger a refetch because they are not part of the query key
  sorting?: SortingState;
  queryOptions?: Omit<UseQueryOptions<UseGetPaginatedRolloutsOutput, ApiError, UseGetPaginatedRolloutsOutput>, 'queryKey' | 'queryFn'>;
};

export const useGetPaginatedRollouts = (params?: UseGetPaginatedRolloutsParams) => {
  const { queryParams = DEFAULT_QUERY_PARAMS, sorting = [], queryOptions } = params ?? {};
  const page = useRolloutsTableStore((state) => state.page);
  const size = useRolloutsTableStore((state) => state.size);

  const { serverSort, isClient, activeSort } = computeSort(sorting, ROLLOUTS_SERVER_SORT, 'name:ASC');

  const queryKey = ['rollouts', page, size, serverSort ?? 'client', activeSort?.columnId, activeSort?.direction];

  const { data, isLoading, error, refetch } = useQuery<UseGetPaginatedRolloutsOutput, ApiError>({
    queryKey,
    queryFn: async () => {
      if (isClient) {
        const { rollouts, totalRollouts } = await RolloutsService.fetchRollouts({
          queryParams: { representation: Representation.FULL, offset: 0, limit: GLOBAL_SORT_MAX_ROWS, ...queryParams },
        });
        if (totalRollouts > GLOBAL_SORT_MAX_ROWS) {
          console.warn(`Client-side rollout sort truncated to ${GLOBAL_SORT_MAX_ROWS} of ${totalRollouts} rows`);
        }
        const sorted = sortRowsClientSide(rollouts, activeSort);
        return { rollouts: paginateRows(sorted, page, size), totalRollouts: sorted.length };
      }

      return RolloutsService.fetchRollouts({
        queryParams: { representation: Representation.FULL, offset: page * size, limit: size, sort: serverSort, ...queryParams },
      });
    },
    ...queryOptions,
  });

  return { data, isLoading, error, refetch };
};

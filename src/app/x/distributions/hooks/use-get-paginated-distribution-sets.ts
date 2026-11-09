import { Distribution, FilterFiql } from '@/entities';
import { DistributionSetsService } from '@/services/distribution-sets-service';
import { useDistributionSetFiltersStore } from '@/stores/distribution-set-filters-store';
import { useDistributionsSetsTableStore } from '@/stores/distribution-sets-table-store';
import { ApiError } from '@/types/hawkbit-api/error';
import type { SortingState } from '@tanstack/react-table';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { DISTRIBUTION_SETS_SERVER_SORT } from '@/utils/table-sort-maps';
import { computeSort, GLOBAL_SORT_MAX_ROWS, paginateRows, sortRowsClientSide } from '@/utils/global-sort';

type UseGetPaginatedDistributionSetsOutput = {
  distributionSets: Distribution[];
  totalDistributionSets: number;
};

type UseGetPaginatedDistributionSetsParams = {
  sorting?: SortingState;
  queryOptions?: Omit<UseQueryOptions<UseGetPaginatedDistributionSetsOutput, ApiError, UseGetPaginatedDistributionSetsOutput>, 'queryKey' | 'queryFn'>;
};

export const useGetPaginatedDistributionSets = (params?: UseGetPaginatedDistributionSetsParams) => {
  const { sorting = [], queryOptions } = params ?? {};

  const filters = useDistributionSetFiltersStore((state) => state.filters);
  const fiqlQueryParam = FilterFiql.parseFiltersToFeedItemQueryLanguage(Object.values(filters) ?? []);
  const query = fiqlQueryParam !== '' ? fiqlQueryParam : undefined;

  const page = useDistributionsSetsTableStore((state) => state.page);
  const size = useDistributionsSetsTableStore((state) => state.size);

  const { serverSort, isClient, activeSort } = computeSort(sorting, DISTRIBUTION_SETS_SERVER_SORT, 'name:ASC');

  const queryKey = ['distribution-sets', page, size, query, serverSort ?? 'client', activeSort?.columnId, activeSort?.direction];

  return useQuery<UseGetPaginatedDistributionSetsOutput, ApiError>({
    queryKey,
    queryFn: async () => {
      if (isClient) {
        const { distributionSets, totalDistributionSets } = await DistributionSetsService.fetchDistributionSets(
          { filters: [] },
          { query, offset: 0, limit: GLOBAL_SORT_MAX_ROWS }
        );
        if (totalDistributionSets > GLOBAL_SORT_MAX_ROWS) {
          console.warn(`Client-side distribution set sort truncated to ${GLOBAL_SORT_MAX_ROWS} of ${totalDistributionSets} rows`);
        }
        const sorted = sortRowsClientSide(distributionSets, activeSort);
        return { distributionSets: paginateRows(sorted, page, size), totalDistributionSets: sorted.length };
      }

      return DistributionSetsService.fetchDistributionSets({ filters: [] }, { query, offset: page * size, limit: size, sort: serverSort });
    },
    ...queryOptions,
  });
};

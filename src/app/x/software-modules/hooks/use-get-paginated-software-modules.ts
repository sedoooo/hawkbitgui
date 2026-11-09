import { SoftwareModule } from '@/entities/software-module';
import { SoftwareModulesService } from '@/services/software-modules-service';
import { useSoftwareModulesStore } from '@/stores/software-modules-store';
import { ApiError } from '@/types/hawkbit-api/error';
import type { SortingState } from '@tanstack/react-table';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { SOFTWARE_MODULES_SERVER_SORT } from '@/utils/table-sort-maps';
import { computeSort, GLOBAL_SORT_MAX_ROWS, paginateRows, sortRowsClientSide } from '@/utils/global-sort';

type UseGetPaginatedSoftwareModulesOutput = {
  softwareModules: SoftwareModule[];
  totalSoftwareModules: number;
};

type UseGetPaginatedSoftwareModulesParams = {
  queryParams?: { q?: string };
  sorting?: SortingState;
  queryOptions?: Omit<UseQueryOptions<UseGetPaginatedSoftwareModulesOutput, ApiError, UseGetPaginatedSoftwareModulesOutput>, 'queryKey' | 'queryFn'>;
};

export const useGetPaginatedSoftwareModules = (params?: UseGetPaginatedSoftwareModulesParams) => {
  const { queryParams = {}, sorting = [], queryOptions } = params ?? {};
  const page = useSoftwareModulesStore((state) => state.page);
  const size = useSoftwareModulesStore((state) => state.size);

  const { serverSort, isClient, activeSort } = computeSort(sorting, SOFTWARE_MODULES_SERVER_SORT, 'name:ASC');

  const queryKey = ['software-modules', queryParams.q, page, size, serverSort ?? 'client', activeSort?.columnId, activeSort?.direction];

  const { data, isLoading, error, refetch } = useQuery<UseGetPaginatedSoftwareModulesOutput, ApiError>({
    queryKey,
    queryFn: async () => {
      if (isClient) {
        const { softwareModules, totalSoftwareModules } = await SoftwareModulesService.fetchSoftwareModules({
          queryParams: { ...queryParams, offset: 0, limit: GLOBAL_SORT_MAX_ROWS },
        });
        if (totalSoftwareModules > GLOBAL_SORT_MAX_ROWS) {
          console.warn(`Client-side software module sort truncated to ${GLOBAL_SORT_MAX_ROWS} of ${totalSoftwareModules} rows`);
        }
        const sorted = sortRowsClientSide(softwareModules, activeSort);
        return { softwareModules: paginateRows(sorted, page, size), totalSoftwareModules: sorted.length };
      }

      return SoftwareModulesService.fetchSoftwareModules({ queryParams: { ...queryParams, offset: page * size, limit: size, sort: serverSort } });
    },
    ...queryOptions,
  });

  return { data, isLoading, error, refetch };
};

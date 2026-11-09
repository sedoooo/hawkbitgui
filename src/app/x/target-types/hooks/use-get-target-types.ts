import { TargetType } from '@/entities/target-type';
import { TargetsTypesService } from '@/services/targets-types-service';
import { ApiError } from '@/types/hawkbit-api/error';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

type UseGetTargetTypesParams = {
  queryOptions?: Omit<UseQueryOptions<TargetType[], ApiError, TargetType[]>, 'queryKey' | 'queryFn'>;
};

export const useGetTargetTypes = (params?: UseGetTargetTypesParams) => {
  const { queryOptions } = params ?? {};
  const queryKey = ['target-types-detailed'];

  const { data, isLoading, error, refetch } = useQuery<TargetType[], ApiError>({
    queryKey,
    queryFn: () => TargetsTypesService.fetchTargetTypesDetailed(),
    ...queryOptions,
  });

  return { data, isLoading, error, refetch };
};

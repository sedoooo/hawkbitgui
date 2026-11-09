import { ApiResponse } from '@/services/types';
import { TargetType } from '@/entities';
import type { TargetTypeCompatibility } from '@/utils/target-types';

export type GetTargetsTypesResponse = ApiResponse<TargetType[]>;

export type CreateTypeResponse = TargetType[];

export type CreateTypeInput = {
  name: string;
  key: string;
  description?: string;
  colour?: string;
  compatibleDistributionSetTypes?: TargetTypeCompatibility[];
};

export type UpdateTypeInput = {
  id: number;
  name?: string;
  key?: string;
  description?: string;
  colour?: string;
  compatibleDistributionSetTypes?: TargetTypeCompatibility[];
};

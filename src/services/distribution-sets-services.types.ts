import { ApiResponse } from './types';
import { Distribution, FilterFiql, SoftwareModule } from '@/entities';
import { AssignmentResponse } from './targets-service.types';

export type CreateDistributionSetInput = {
  name: string;
  description?: string;
  version: string;
  locked?: boolean;
  requiredMigrationStep?: boolean;
  modules: { id: number }[];
  type: string;
};

export type CreateDistributionSetResponse = Distribution;

export interface GetDistributionSetsInput {
  filters: FilterFiql[];
}

export type GetDistributionSetsResponse = ApiResponse<Distribution[]>;

export type GetDistributionSetsOutput = { distributionSets: Distribution[]; totalDistributionSets: number };

export type GetAssignedSoftwareModulesResponse = ApiResponse<SoftwareModule[]>;

export type AssignModulesToDistributionSetInput = {
  distributionSetId: number;
  softwareModuleIds: number[];
};

export type UnassignModulesToDistributionSetInput = {
  distributionSetId: number;
  softwareModuleId: number;
};

type MaintenanceWindow = {
  schedule: string;
  duration: string;
  timezone: string;
};

export type AssignTargetsToDistributionInput = {
  distributionId: string | number;
  targetConfigs: {
    id: number | string;
    forcetime?: number;
    weight?: number;
    confirmationRequired?: boolean;
    type?: 'soft' | 'forced' | 'timeforced' | 'downloadonly';
    maintenanceWindow?: MaintenanceWindow;
  }[];
};

export type AssignTargetsToDistributionOutput = AssignmentResponse;

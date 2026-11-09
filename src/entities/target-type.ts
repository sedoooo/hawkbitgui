import type { DistributionSetType } from './distribution-set-type';

export interface TargetType {
  id: number;
  createdBy: string;
  createdAt: number;
  lastModifiedBy: string;
  lastModifiedAt: number;
  name: string;
  key: string;
  description: string;
  colour?: string;
  deleted?: boolean;
  compatibleDistributionSetTypes?: DistributionSetType[];
  targetCount?: number;
}

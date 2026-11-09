import type { ServerSortMap } from './global-sort';

/**
 * Server-sortable fields verified against the hawkBit 1.1.0 management API
 * (`?sort=<field>:ASC|DESC`). A `null` entry means the column is either derived
 * or only sorted lexically by hawkBit (e.g. semver columns), so it uses the
 * bounded full-fetch client sort instead.
 */
export const TARGETS_SERVER_SORT: ServerSortMap = {
  controllerId: 'controllerId',
  name: 'name',
  description: 'description',
  updateStatus: 'updateStatus',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  lastModifiedBy: 'lastModifiedBy',
  lastModifiedAt: 'lastModifiedAt',
  targetType: 'targetType',
  targetTypeName: null,
};

export const DISTRIBUTION_SETS_SERVER_SORT: ServerSortMap = {
  id: 'id',
  name: 'name',
  version: null,
  createdAt: 'createdAt',
  typeName: 'type',
  type: 'type',
  description: 'description',
  createdBy: 'createdBy',
  lastModifiedBy: 'lastModifiedBy',
  lastModifiedAt: 'lastModifiedAt',
};

export const SOFTWARE_MODULES_SERVER_SORT: ServerSortMap = {
  id: 'id',
  name: 'name',
  version: null,
  typeName: 'type',
  type: 'type',
  vendor: null,
  description: 'description',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  lastModifiedBy: 'lastModifiedBy',
  lastModifiedAt: 'lastModifiedAt',
};

export const ROLLOUTS_SERVER_SORT: ServerSortMap = {
  id: 'id',
  name: 'name',
  description: 'description',
  status: 'status',
  type: null,
  '_links.distributionset.name': null,
  totalTargetsPerStatus: null,
  totalGroups: null,
  totalTargets: null,
  approveDecidedBy: null,
  approvalRemark: null,
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  lastModifiedBy: 'lastModifiedBy',
  lastModifiedAt: 'lastModifiedAt',
};

export const TARGET_FILTERS_SERVER_SORT: ServerSortMap = {
  id: 'id',
  name: 'name',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  lastModifiedBy: 'lastModifiedBy',
  lastModifiedAt: 'lastModifiedAt',
  autoAssignDistributionSetName: null,
};

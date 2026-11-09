import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const EMPTY_DISPLAY_VALUE = '—';

type SoftwareModuleDisplayFields = {
  type?: string | null;
  typeName?: string | null;
  vendor?: string | null;
};

type DistributionSetDisplayFields = {
  type?: string | null;
  typeName?: string | null;
};

export function formatUtcDateTime(value: number | string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY_DISPLAY_VALUE;
  }

  const parsed = dayjs(value);

  if (!parsed.isValid()) {
    return EMPTY_DISPLAY_VALUE;
  }

  return parsed.utc().format('YYYY-MM-DD HH:mm:ss [UTC]');
}

export function resolveSoftwareModuleType(module: SoftwareModuleDisplayFields): string {
  return module.typeName || module.type || EMPTY_DISPLAY_VALUE;
}

export function resolveSoftwareModuleVendor(module: SoftwareModuleDisplayFields): string {
  return module.vendor || EMPTY_DISPLAY_VALUE;
}

export function resolveDistributionSetType(distributionSet: DistributionSetDisplayFields): string {
  return distributionSet.typeName || distributionSet.type || EMPTY_DISPLAY_VALUE;
}

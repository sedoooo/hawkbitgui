import type { Distribution } from '@/entities/distribution';

export function getDistributionModuleIds(distribution: Pick<Distribution, 'modules'>): number[] {
  if (!distribution.modules) {
    return [];
  }

  return distribution.modules
    .map((module) => module.id)
    .filter((id): id is number => typeof id === 'number')
    .sort((a, b) => a - b);
}

export function findTwinDistributionSet(source: Distribution, allDistributionSets: Distribution[]): Distribution | undefined {
  const resolvedSource = allDistributionSets.find((distribution) => distribution.id === source.id) ?? source;
  const sourceModuleIds = getDistributionModuleIds(resolvedSource);

  if (sourceModuleIds.length === 0) {
    return undefined;
  }

  const candidates = allDistributionSets.filter((distribution) => {
    if (distribution.id === resolvedSource.id) {
      return false;
    }

    const moduleIds = getDistributionModuleIds(distribution);
    return moduleIds.length === sourceModuleIds.length && moduleIds.every((id, index) => id === sourceModuleIds[index]);
  });

  if (candidates.length === 0) {
    return undefined;
  }

  const preferredTwin = candidates.find((distribution) => /twin/i.test(`${distribution.name} ${distribution.version}`));
  return preferredTwin ?? candidates[0];
}

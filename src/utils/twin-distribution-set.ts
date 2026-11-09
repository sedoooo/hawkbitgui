import type { Distribution } from '@/entities/distribution';
import type { CreateDistributionSetInput } from '@/services/distribution-sets-services.types';

const MAX_NAME_OR_VERSION_LENGTH = 60;

const appendSuffix = (value: string, suffix: string): string => {
  const base = value.slice(0, Math.max(0, MAX_NAME_OR_VERSION_LENGTH - suffix.length));
  return `${base}${suffix}`;
};

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

/**
 * Builds the payload for an explicit, user-confirmed "auto-create twin" step.
 * The twin reuses the exact same software modules (byte-identical payload) with
 * the same distribution set type, so it stays compatible with every target that
 * could receive the source distribution set. Only the name and version change.
 */
export function buildTwinDistributionSetInput(source: Distribution, allDistributionSets: Distribution[]): CreateDistributionSetInput {
  const moduleIds = getDistributionModuleIds(source);
  if (moduleIds.length === 0) {
    throw new Error(`Cannot create a twin for ${source.name}: the distribution set has no software modules.`);
  }

  const taken = new Set(allDistributionSets.map((distribution) => `${distribution.name}\u0000${distribution.version}`));
  let suffix = '-twin';
  let name = appendSuffix(source.name, suffix);
  let version = appendSuffix(source.version, suffix);
  let counter = 2;
  while (taken.has(`${name}\u0000${version}`)) {
    suffix = `-twin-${counter}`;
    name = appendSuffix(source.name, suffix);
    version = appendSuffix(source.version, suffix);
    counter += 1;
  }

  const description = source.description
    ? `${source.description} (byte-identical twin for forced reinstall)`
    : `Byte-identical twin of ${source.name} ${source.version} for forced reinstall`;

  return {
    name,
    description,
    version,
    type: source.type,
    modules: moduleIds.map((id) => ({ id })),
    requiredMigrationStep: source.requiredMigrationStep,
    locked: false,
  };
}

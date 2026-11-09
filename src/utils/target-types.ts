import type { DistributionSetType } from '@/entities/distribution-set-type';

export type TargetTypeCompatibility = {
  id: number;
};

export type TargetTypeFormInput = {
  name: string;
  key?: string;
  description?: string;
  colour?: string;
  compatibleDistributionSetTypes?: TargetTypeCompatibility[];
};

export type TargetTypeCreatePayload = {
  name: string;
  key: string;
  description?: string;
  colour?: string;
  compatibledistributionsettypes?: TargetTypeCompatibility[];
};

export type TargetTypeUpdatePayload = {
  name?: string;
  description?: string;
  colour?: string;
};

export function normalizeCompatibilityInput(compatibleDistributionSetTypes?: Array<DistributionSetType | TargetTypeCompatibility>): TargetTypeCompatibility[] {
  if (!compatibleDistributionSetTypes) {
    return [];
  }

  const uniqueIds = new Set<number>();
  compatibleDistributionSetTypes.forEach((type) => {
    if (typeof type.id === 'number') {
      uniqueIds.add(type.id);
    }
  });

  return Array.from(uniqueIds).map((id) => ({ id }));
}

export function buildTargetTypeCreatePayload(input: TargetTypeFormInput): TargetTypeCreatePayload {
  if (!input.key || input.key.trim() === '') {
    throw new Error('A target type key is required');
  }

  return {
    name: input.name,
    key: input.key,
    description: input.description ?? '',
    ...(input.colour ? { colour: input.colour } : {}),
    ...(input.compatibleDistributionSetTypes && input.compatibleDistributionSetTypes.length > 0
      ? { compatibledistributionsettypes: normalizeCompatibilityInput(input.compatibleDistributionSetTypes) }
      : {}),
  };
}

export function buildTargetTypeUpdatePayload(input: { name?: string; description?: string; colour?: string }): TargetTypeUpdatePayload {
  return {
    name: input.name,
    description: input.description ?? '',
    ...(input.colour ? { colour: input.colour } : {}),
  };
}

export function diffCompatibleDistributionSetTypeIds(currentIds: number[], nextIds: number[]): { added: number[]; removed: number[] } {
  const current = new Set(currentIds.filter((id) => typeof id === 'number'));
  const next = new Set(nextIds.filter((id) => typeof id === 'number'));

  return {
    added: Array.from(next).filter((id) => !current.has(id)),
    removed: Array.from(current).filter((id) => !next.has(id)),
  };
}

export function formatCompatibleDistributionSetTypes(types?: DistributionSetType[]): string {
  if (!types || types.length === 0) {
    return '—';
  }

  return types.map((type) => type.name || type.key).join(', ');
}

import type { Distribution } from '@/entities/distribution';
import type { TargetAction } from '@/entities/target-action';

export function unwrapCreatedDistributionSet(response: Distribution | Distribution[]): Distribution {
  const created = Array.isArray(response) ? response[0] : response;
  if (!created) {
    throw new Error('hawkBit did not return the created distribution set');
  }
  return created;
}

export function parseDistributionSetId(href?: string | null): number | undefined {
  if (!href) {
    return undefined;
  }

  const match = /\/distributionsets\/(\d+)(?:[/?#]|$)/.exec(href);

  if (!match) {
    return undefined;
  }

  const id = Number(match[1]);

  return Number.isInteger(id) ? id : undefined;
}

export function getActionDistributionSetId(action: TargetAction): number | undefined {
  return parseDistributionSetId(action._links?.distributionset?.href);
}

export function applyDistributionSetTypes(actions: TargetAction[], typesById: Map<number, string>): TargetAction[] {
  return actions.map((action) => {
    const distributionSetId = getActionDistributionSetId(action);
    const distributionSetType = distributionSetId !== undefined ? typesById.get(distributionSetId) : undefined;

    return distributionSetType ? { ...action, distributionSetType } : action;
  });
}

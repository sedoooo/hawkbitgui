import { describe, expect, test } from 'bun:test';
import type { TargetAction } from '../src/entities/target-action';
import { applyDistributionSetTypes, getActionDistributionSetId, parseDistributionSetId } from '../src/utils/distribution-set';

describe('parseDistributionSetId', () => {
  test('extracts the distribution set id from a hawkBit link', () => {
    expect(parseDistributionSetId('http://192.168.178.81:8080/rest/v1/distributionsets/117')).toBe(117);
    expect(parseDistributionSetId('/rest/v1/distributionsets/42')).toBe(42);
    expect(parseDistributionSetId('https://host/rest/v1/distributionsets/7/')).toBe(7);
  });

  test('returns undefined for empty or unrelated links', () => {
    expect(parseDistributionSetId(undefined)).toBeUndefined();
    expect(parseDistributionSetId('')).toBeUndefined();
    expect(parseDistributionSetId('http://host/rest/v1/targets/fota-dk2-01')).toBeUndefined();
  });
});

describe('applyDistributionSetTypes', () => {
  const action = (href: string): TargetAction => ({
    id: 1,
    createdBy: 'admin',
    createdAt: 0,
    lastModifiedBy: 'admin',
    lastModifiedAt: 0,
    type: 'update',
    status: 'finished',
    detailStatus: 'finished',
    rollout: 0,
    rolloutName: '',
    forceType: 'forced',
    _links: {
      self: { href: '/rest/v1/targets/t/actions/1' },
      target: { href: '/rest/v1/targets/t' },
      distributionset: { href },
      status: { href: '/rest/v1/targets/t/actions/1/status' },
      rollout: { href: '/rest/v1/rollouts/1' },
    },
  });

  test('resolves the distribution set type by id from the action link', () => {
    const result = applyDistributionSetTypes([action('/rest/v1/distributionsets/117')], new Map([[117, 'OS only']]));

    expect(getActionDistributionSetId(result[0])).toBe(117);
    expect(result[0].distributionSetType).toBe('OS only');
  });

  test('leaves the action unchanged when the type is unknown', () => {
    const original = action('/rest/v1/distributionsets/999');
    const result = applyDistributionSetTypes([original], new Map([[117, 'OS only']]));

    expect(result[0]).toBe(original);
    expect(result[0].distributionSetType).toBeUndefined();
  });
});

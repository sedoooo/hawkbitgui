import { describe, expect, test } from 'bun:test';
import type { Distribution } from '../src/entities/distribution';
import { findTwinDistributionSet, getDistributionModuleIds } from '../src/utils/twin-distribution-set';

const makeDistribution = (id: number, name: string, version: string, moduleIds: number[]): Distribution =>
  ({
    id,
    name,
    version,
    description: '',
    type: 'os',
    typeName: 'OS only',
    complete: true,
    deleted: false,
    valid: true,
    requiredMigrationStep: false,
    modules: moduleIds.map((moduleId) => ({ id: moduleId, name: String(moduleId) })),
    createdBy: 'admin',
    createdAt: 0,
    lastModifiedBy: 'admin',
    lastModifiedAt: 0,
  }) as Distribution;

describe('getDistributionModuleIds', () => {
  test('returns a sorted list of software module ids', () => {
    expect(getDistributionModuleIds(makeDistribution(1, 'a', '1', [9, 3, 5]))).toEqual([3, 5, 9]);
  });
});

describe('findTwinDistributionSet', () => {
  const source = makeDistribution(116, 'gw-stm32mp1-6.1.14', '6.1.14', [125]);
  const twin = makeDistribution(117, 'gw-stm32mp1-6.1.14-twin', '6.1.14-twin', [125]);
  const other = makeDistribution(118, 'something-else', '1.0.0', [126]);

  test('finds the byte-identical twin and prefers a twin-named distribution set', () => {
    expect(findTwinDistributionSet(source, [source, other, twin])).toBe(twin);
  });

  test('falls back to any distribution set with the same modules', () => {
    const sameModules = makeDistribution(200, 'renamed-copy', 'copy', [125]);
    expect(findTwinDistributionSet(source, [source, other, sameModules])).toBe(sameModules);
  });

  test('returns undefined when there is no byte-identical twin', () => {
    expect(findTwinDistributionSet(source, [source, other])).toBeUndefined();
  });

  test('resolves the source modules from the full distribution set list when the dragged object lacks them', () => {
    const sourceWithoutModules = { ...source, modules: [] } as Distribution;
    expect(findTwinDistributionSet(sourceWithoutModules, [source, twin])).toBe(twin);
  });
});

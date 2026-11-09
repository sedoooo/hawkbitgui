import { describe, expect, test } from 'bun:test';
import type { Distribution } from '../src/entities/distribution';
import { buildTwinDistributionSetInput, findTwinDistributionSet, getDistributionModuleIds } from '../src/utils/twin-distribution-set';

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

describe('buildTwinDistributionSetInput', () => {
  const source = makeDistribution(116, 'gw-stm32mp1-6.1.14', '6.1.14', [125]);

  test('reuses the same modules and type with a twin name and version', () => {
    const input = buildTwinDistributionSetInput(source, [source, makeDistribution(118, 'something-else', '1.0.0', [126])]);

    expect(input.name).toBe('gw-stm32mp1-6.1.14-twin');
    expect(input.version).toBe('6.1.14-twin');
    expect(input.type).toBe('os');
    expect(input.modules).toEqual([{ id: 125 }]);
    expect(input.requiredMigrationStep).toBe(false);
    expect(input.locked).toBe(false);
    expect(input.description).toContain('Byte-identical twin');
  });

  test('avoids an existing name/version by adding a numeric suffix', () => {
    const existing = makeDistribution(117, 'gw-stm32mp1-6.1.14-twin', '6.1.14-twin', [126]);
    const input = buildTwinDistributionSetInput(source, [source, existing]);

    expect(input.name).toBe('gw-stm32mp1-6.1.14-twin-2');
    expect(input.version).toBe('6.1.14-twin-2');
    expect(input.modules).toEqual([{ id: 125 }]);
  });

  test('keeps a too-long name within the allowed length', () => {
    const longSource = makeDistribution(300, 'n'.repeat(80), 'v'.repeat(80), [125]);
    const input = buildTwinDistributionSetInput(longSource, [longSource]);

    expect(input.name.length).toBeLessThanOrEqual(60);
    expect(input.version.length).toBeLessThanOrEqual(60);
    expect(input.name.endsWith('-twin')).toBe(true);
  });

  test('throws when the source has no software modules', () => {
    expect(() => buildTwinDistributionSetInput({ ...source, modules: [] }, [source])).toThrow(/no software modules/);
  });
});

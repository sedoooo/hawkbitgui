import { describe, expect, test } from 'bun:test';
import {
  buildTargetTypeCreatePayload,
  buildTargetTypeUpdatePayload,
  diffCompatibleDistributionSetTypeIds,
  formatCompatibleDistributionSetTypes,
  normalizeCompatibilityInput,
} from '../src/utils/target-types';

const dsTypes = [
  {
    id: 4,
    name: 'Gateway release',
    key: 'gw-release',
    description: '',
    colour: '#000',
    deleted: false,
    createdBy: 'admin',
    createdAt: 0,
    lastModifiedBy: 'admin',
    lastModifiedAt: 0,
    _links: {},
  },
  {
    id: 1,
    name: 'OS only',
    key: 'os',
    description: '',
    colour: '#000',
    deleted: false,
    createdBy: 'system',
    createdAt: 0,
    lastModifiedBy: 'system',
    lastModifiedAt: 0,
    _links: {},
  },
];

describe('target type payloads', () => {
  test('builds a create payload with the hawkBit compatibility field name', () => {
    const payload = buildTargetTypeCreatePayload({
      name: 'Gateway',
      key: 'gw-stm32mp1',
      description: 'Gateway board',
      colour: '#562563',
      compatibleDistributionSetTypes: dsTypes,
    });

    expect(payload).toEqual({
      name: 'Gateway',
      key: 'gw-stm32mp1',
      description: 'Gateway board',
      colour: '#562563',
      compatibledistributionsettypes: [{ id: 4 }, { id: 1 }],
    });
  });

  test('rejects a create payload without a key', () => {
    expect(() => buildTargetTypeCreatePayload({ name: 'Gateway' })).toThrow('key');
  });

  test('does not send an immutable key on update', () => {
    const payload = buildTargetTypeUpdatePayload({ name: 'Renamed', key: 'ignored', description: 'desc', colour: '#fff' });

    expect(payload).toEqual({ name: 'Renamed', description: 'desc', colour: '#fff' });
  });

  test('normalizes and de-duplicates compatibility ids', () => {
    expect(normalizeCompatibilityInput([...dsTypes, { id: 4 }])).toEqual([{ id: 4 }, { id: 1 }]);
  });
});

describe('diffCompatibleDistributionSetTypeIds', () => {
  test('returns additions and removals', () => {
    expect(diffCompatibleDistributionSetTypeIds([1, 4], [4, 6])).toEqual({ added: [6], removed: [1] });
  });

  test('is empty when nothing changed', () => {
    expect(diffCompatibleDistributionSetTypeIds([1, 4], [4, 1])).toEqual({ added: [], removed: [] });
  });
});

describe('formatCompatibleDistributionSetTypes', () => {
  test('renders names or a placeholder', () => {
    expect(formatCompatibleDistributionSetTypes(dsTypes)).toBe('Gateway release, OS only');
    expect(formatCompatibleDistributionSetTypes([])).toBe('—');
  });
});

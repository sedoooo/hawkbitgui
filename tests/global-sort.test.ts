import { describe, expect, test } from 'bun:test';
import { computeSort, getActiveSort, getValueByPath, paginateRows, sortRowsClientSide } from '../src/utils/global-sort';
import { DISTRIBUTION_SETS_SERVER_SORT, SOFTWARE_MODULES_SERVER_SORT, TARGETS_SERVER_SORT } from '../src/utils/table-sort-maps';

describe('computeSort', () => {
  test('maps an API-sortable column to a hawkBit sort query', () => {
    const asc = computeSort([{ id: 'name', desc: false }], DISTRIBUTION_SETS_SERVER_SORT, 'name:ASC');
    expect(asc.serverSort).toBe('name:ASC');
    expect(asc.isClient).toBe(false);

    const desc = computeSort([{ id: 'createdAt', desc: true }], DISTRIBUTION_SETS_SERVER_SORT, 'name:ASC');
    expect(desc.serverSort).toBe('createdAt:DESC');
  });

  test('maps derived columns to their equivalent server field', () => {
    expect(computeSort([{ id: 'typeName', desc: false }], SOFTWARE_MODULES_SERVER_SORT).serverSort).toBe('type:ASC');
    expect(computeSort([{ id: 'updateStatus', desc: false }], TARGETS_SERVER_SORT).serverSort).toBe('updateStatus:ASC');
  });

  test('falls back to the bounded client sort for semver and unsupported columns', () => {
    expect(computeSort([{ id: 'version', desc: false }], DISTRIBUTION_SETS_SERVER_SORT).isClient).toBe(true);
    expect(computeSort([{ id: 'vendor', desc: false }], SOFTWARE_MODULES_SERVER_SORT).isClient).toBe(true);
  });

  test('uses the default server sort when nothing is selected (asc -> desc -> none)', () => {
    expect(computeSort([], DISTRIBUTION_SETS_SERVER_SORT, 'name:ASC')).toMatchObject({ serverSort: 'name:ASC', isClient: false });
    expect(getActiveSort([])).toBeNull();
  });
});

describe('sortRowsClientSide', () => {
  const rows = [
    { id: 1, name: 'ds-c', version: '6.1.13' },
    { id: 2, name: 'ds-a', version: '6.1.9' },
    { id: 3, name: 'ds-b', version: '6.1.10' },
    { id: 4, name: 'ds-d', version: '2.0.0' },
  ];

  test('sorts the full dataset using the semver comparator', () => {
    const ascending = sortRowsClientSide(rows, { columnId: 'version', direction: 'asc' });
    expect(ascending.map((row) => row.version)).toEqual(['2.0.0', '6.1.9', '6.1.10', '6.1.13']);

    const descending = sortRowsClientSide(rows, { columnId: 'version', direction: 'desc' });
    expect(descending.map((row) => row.version)).toEqual(['6.1.13', '6.1.10', '6.1.9', '2.0.0']);
  });

  test('paginates after the global sort so page 2 continues the global order', () => {
    const sorted = sortRowsClientSide(rows, { columnId: 'version', direction: 'asc' });
    expect(paginateRows(sorted, 0, 2).map((row) => row.id)).toEqual([4, 2]);
    expect(paginateRows(sorted, 1, 2).map((row) => row.id)).toEqual([3, 1]);
  });

  test('breaks ties deterministically so pages remain stable', () => {
    const tied = [
      { id: 9, name: 'b', version: '1.0.0' },
      { id: 11, name: 'a', version: '1.0.0' },
      { id: 10, name: 'c', version: '1.0.0' },
    ];
    const ascending = sortRowsClientSide(tied, { columnId: 'version', direction: 'asc' });
    const descending = sortRowsClientSide(tied, { columnId: 'version', direction: 'desc' });
    expect(ascending.map((row) => row.id)).toEqual([9, 10, 11]);
    expect(descending.map((row) => row.id)).toEqual([9, 10, 11]);
  });

  test('reads nested accessor paths', () => {
    expect(getValueByPath({ _links: { distributionset: { name: 'bundle' } } }, '_links.distributionset.name')).toBe('bundle');
  });
});

import { describe, expect, test } from 'bun:test';
import dayjs from 'dayjs';
import {
  buildListFilterQuery,
  combineQueryParts,
  EMPTY_LIST_FILTERS,
  filterRowsByListFilters,
  getDistinctTypeOptions,
  isListFilterActive,
  isTimestampInDateRange,
  normalizeDateRange,
} from '../src/utils/list-filters';

const startOf = (value: string) => dayjs(value).startOf('day').valueOf();
const endOf = (value: string) => dayjs(value).endOf('day').valueOf();

describe('buildListFilterQuery', () => {
  test('combines a type and an inclusive date range into one RSQL filter', () => {
    const query = buildListFilterQuery({ type: 'os', dateFrom: '2026-11-01', dateTo: '2026-11-05' });

    expect(query).toBe(`type=="os";createdAt=ge=${startOf('2026-11-01')};createdAt=le=${endOf('2026-11-05')}`);
  });

  test('supports custom fields and escapes quotes in type values', () => {
    const query = buildListFilterQuery({ type: 'node"fw', dateFrom: '', dateTo: '' }, { typeField: 'targetType.id', dateField: 'lastModifiedAt' });

    expect(query).toBe('targetType.id=="node\\"fw"');
  });

  test('returns an empty string when no filter is set', () => {
    expect(buildListFilterQuery(EMPTY_LIST_FILTERS)).toBe('');
  });

  test('ignores invalid dates and repairs a reversed range', () => {
    expect(buildListFilterQuery({ type: '', dateFrom: 'not-a-date', dateTo: '' })).toBe('');
    expect(buildListFilterQuery({ type: '', dateFrom: '2026-11-05', dateTo: '2026-11-01' })).toBe(
      `createdAt=ge=${startOf('2026-11-01')};createdAt=le=${endOf('2026-11-05')}`
    );
  });
});

describe('normalizeDateRange', () => {
  test('uses the start of the from day and the end of the to day', () => {
    expect(normalizeDateRange({ dateFrom: '2026-11-01', dateTo: '2026-11-05' })).toEqual({
      from: startOf('2026-11-01'),
      to: endOf('2026-11-05'),
    });
  });

  test('allows a single bound', () => {
    expect(normalizeDateRange({ dateFrom: '2026-11-01', dateTo: '' })).toEqual({ from: startOf('2026-11-01'), to: undefined });
    expect(normalizeDateRange({ dateFrom: '', dateTo: '2026-11-05' })).toEqual({ from: undefined, to: endOf('2026-11-05') });
  });
});

describe('combineQueryParts', () => {
  test('joins non-empty query parts with the FIQL AND separator', () => {
    expect(combineQueryParts('type=="os"', '', undefined, 'createdAt=ge=1')).toBe('type=="os";createdAt=ge=1');
    expect(combineQueryParts('', undefined)).toBeUndefined();
  });
});

describe('isTimestampInDateRange', () => {
  const filters = { type: '', dateFrom: '2026-11-01', dateTo: '2026-11-05' };

  test('treats the range as inclusive of both days', () => {
    expect(isTimestampInDateRange(startOf('2026-11-01'), filters)).toBe(true);
    expect(isTimestampInDateRange(endOf('2026-11-05'), filters)).toBe(true);
  });

  test('rejects timestamps outside the range and missing values', () => {
    expect(isTimestampInDateRange(startOf('2026-10-31'), filters)).toBe(false);
    expect(isTimestampInDateRange(endOf('2026-11-06'), filters)).toBe(false);
    expect(isTimestampInDateRange(undefined, filters)).toBe(false);
  });

  test('does not filter when no date is set', () => {
    expect(isTimestampInDateRange(undefined, EMPTY_LIST_FILTERS)).toBe(true);
    expect(isTimestampInDateRange(123, EMPTY_LIST_FILTERS)).toBe(true);
  });
});

describe('filterRowsByListFilters', () => {
  const rows = [
    { id: 1, type: 'os', createdAt: startOf('2026-11-02') },
    { id: 2, type: 'app', createdAt: startOf('2026-11-03') },
    { id: 3, type: 'os', createdAt: startOf('2026-11-10') },
  ];
  const accessors = {
    getTypes: (row: (typeof rows)[number]) => [row.type],
    getTimestamp: (row: (typeof rows)[number]) => row.createdAt,
  };

  test('returns the original rows when no filter is active', () => {
    expect(filterRowsByListFilters(rows, EMPTY_LIST_FILTERS, accessors)).toBe(rows);
  });

  test('combines type and date range with AND semantics', () => {
    const filtered = filterRowsByListFilters(rows, { type: 'os', dateFrom: '2026-11-01', dateTo: '2026-11-05' }, accessors);

    expect(filtered.map((row) => row.id)).toEqual([1]);
  });

  test('matches case-insensitively and supports multiple candidate types per row', () => {
    const multiAccessors = {
      getTypes: (row: (typeof rows)[number]) => [`action:${row.type}`, `ds:${row.type.toUpperCase()}`],
      getTimestamp: accessors.getTimestamp,
    };

    const filtered = filterRowsByListFilters(rows, { type: 'ds:APP', dateFrom: '', dateTo: '' }, multiAccessors);

    expect(filtered.map((row) => row.id)).toEqual([2]);
  });
});

describe('getDistinctTypeOptions', () => {
  test('deduplicates, sorts and applies labels', () => {
    const options = getDistinctTypeOptions(['os', 'app', 'os', undefined, ''], (value) => (value === 'os' ? 'OS only' : 'Application'));

    expect(options).toEqual([
      { value: 'app', label: 'Application' },
      { value: 'os', label: 'OS only' },
    ]);
  });
});

describe('isListFilterActive', () => {
  test('detects any active control', () => {
    expect(isListFilterActive(EMPTY_LIST_FILTERS)).toBe(false);
    expect(isListFilterActive({ type: 'os', dateFrom: '', dateTo: '' })).toBe(true);
    expect(isListFilterActive({ type: '', dateFrom: '2026-11-01', dateTo: '' })).toBe(true);
  });
});

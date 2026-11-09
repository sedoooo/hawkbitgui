import type { SortingState } from '@tanstack/react-table';
import { compareValues, type SortDirection } from './table-sort';

/**
 * Hard guard for the client-side fallback used by columns that cannot be sorted
 * by the hawkBit management API (semver columns, derived columns). When the
 * filtered result set is larger than this we only sort the first N rows and
 * report the truncated size so pagination stays consistent.
 */
export const GLOBAL_SORT_MAX_ROWS = 2000;

export type ActiveSort = {
  columnId: string;
  direction: SortDirection;
};

export type ServerSortMap = Record<string, string | null | undefined>;

export type ComputedSort = {
  activeSort: ActiveSort | null;
  serverSort?: string;
  isClient: boolean;
};

export function getActiveSort(sorting: SortingState): ActiveSort | null {
  const first = sorting[0];

  if (!first) {
    return null;
  }

  return { columnId: first.id, direction: first.desc ? 'desc' : 'asc' };
}

/**
 * Maps the active table sort to a hawkBit `sort=<field>:ASC|DESC` query
 * parameter. Columns whose map value is falsy/undefined cannot be sorted by the
 * API and fall back to a client-side sort over the full filtered result set.
 */
export function computeSort(sorting: SortingState, serverSortMap: ServerSortMap, defaultSort?: string): ComputedSort {
  const activeSort = getActiveSort(sorting);

  if (!activeSort) {
    return { activeSort: null, serverSort: defaultSort, isClient: false };
  }

  const field = serverSortMap[activeSort.columnId];

  if (field) {
    return {
      activeSort,
      serverSort: `${field}:${activeSort.direction === 'desc' ? 'DESC' : 'ASC'}`,
      isClient: false,
    };
  }

  return { activeSort, serverSort: undefined, isClient: true };
}

export function getValueByPath(row: unknown, path: string): unknown {
  if (row === null || row === undefined) {
    return undefined;
  }

  if (!path.includes('.')) {
    return (row as Record<string, unknown>)[path];
  }

  return path.split('.').reduce<unknown>((value, key) => {
    if (value === null || value === undefined || typeof value !== 'object') {
      return undefined;
    }
    return (value as Record<string, unknown>)[key];
  }, row);
}

export type SortValueGetter<T> = (row: T, columnId: string) => unknown;

function compareTieBreakers(a: unknown, b: unknown): number {
  const aId = (a as { id?: unknown } | null)?.id;
  const bId = (b as { id?: unknown } | null)?.id;

  if (typeof aId === 'number' && typeof bId === 'number' && aId !== bId) {
    return aId - bId;
  }

  const aName = (a as { name?: unknown } | null)?.name;
  const bName = (b as { name?: unknown } | null)?.name;

  if (typeof aName === 'string' && typeof bName === 'string') {
    return aName.localeCompare(bName, 'en', { numeric: true, sensitivity: 'base' });
  }

  return 0;
}

/**
 * Sorts the full (already fetched) result set using the same type-aware
 * comparator as the visible table. Version columns keep using the semver
 * comparator. Ties are broken deterministically by id/name so that page N+1
 * continues the global order across re-fetches.
 */
export function sortRowsClientSide<T>(rows: T[], activeSort: ActiveSort | null, getValue?: SortValueGetter<T>): T[] {
  if (!activeSort) {
    return rows;
  }

  const { columnId, direction } = activeSort;
  const readValue = getValue ?? ((row: T, id: string) => getValueByPath(row, id));

  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const comparison = compareValues(readValue(a.row, columnId), readValue(b.row, columnId), columnId);

      if (comparison !== 0) {
        return direction === 'asc' ? comparison : -comparison;
      }

      const tieBreak = compareTieBreakers(a.row, b.row);

      if (tieBreak !== 0) {
        return tieBreak;
      }

      return a.index - b.index;
    })
    .map((entry) => entry.row);
}

export function paginateRows<T>(rows: T[], page: number, size: number): T[] {
  const start = page * size;
  return rows.slice(start, start + size);
}

import type { Row, SortingFn, SortingState } from '@tanstack/react-table';

type Semver = {
  major: number;
  minor: number;
  patch: number;
  preRelease: string[] | null;
};

const SEMVER_PATTERN = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/;
const NUMERIC_PATTERN = /^\d+$/;
const VERSION_COLUMN_PATTERN = /version$/i;

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
}

function parseSemver(value: string): Semver | null {
  const match = value.trim().match(SEMVER_PATTERN);

  if (!match) {
    return null;
  }

  const [, major, minor, patch, preRelease] = match;

  return {
    major: Number(major),
    minor: minor === undefined ? 0 : Number(minor),
    patch: patch === undefined ? 0 : Number(patch),
    preRelease: preRelease === undefined ? null : preRelease.split('.'),
  };
}

function comparePreRelease(a: string[] | null, b: string[] | null): number {
  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const aPart = a[index];
    const bPart = b[index];

    if (aPart === undefined) {
      return -1;
    }

    if (bPart === undefined) {
      return 1;
    }

    const aIsNumeric = NUMERIC_PATTERN.test(aPart);
    const bIsNumeric = NUMERIC_PATTERN.test(bPart);

    if (aIsNumeric && bIsNumeric) {
      const difference = Number(aPart) - Number(bPart);

      if (difference !== 0) {
        return difference;
      }

      continue;
    }

    if (aIsNumeric) {
      return -1;
    }

    if (bIsNumeric) {
      return 1;
    }

    const difference = naturalCompare(aPart, bPart);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

export function compareSemver(a: string, b: string): number {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);

  if (parsedA === null && parsedB === null) {
    return naturalCompare(a, b);
  }

  if (parsedA === null) {
    return 1;
  }

  if (parsedB === null) {
    return -1;
  }

  const coreDifference = parsedA.major - parsedB.major || parsedA.minor - parsedB.minor || parsedA.patch - parsedB.patch;

  if (coreDifference !== 0) {
    return coreDifference;
  }

  return comparePreRelease(parsedA.preRelease, parsedB.preRelease);
}

export function compareValues(a: unknown, b: unknown, columnId: string): number {
  if (a === null || a === undefined) {
    return b === null || b === undefined ? 0 : 1;
  }

  if (b === null || b === undefined) {
    return -1;
  }

  if (VERSION_COLUMN_PATTERN.test(columnId)) {
    return compareSemver(String(a), String(b));
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  if (typeof a === 'string' && typeof b === 'string') {
    if (ISO_DATE_PATTERN.test(a) && ISO_DATE_PATTERN.test(b)) {
      return Date.parse(a) - Date.parse(b);
    }

    return naturalCompare(a, b);
  }

  return naturalCompare(String(a), String(b));
}

export const typeAwareSortingFn: SortingFn<unknown> = (rowA: Row<unknown>, rowB: Row<unknown>, columnId: string) => {
  return compareValues(rowA.getValue(columnId), rowB.getValue(columnId), columnId);
};

export type SortDirection = 'asc' | 'desc';

export function toggleSortingState(sorting: SortingState, columnId: string): SortingState {
  const current = sorting.find((entry) => entry.id === columnId);

  if (!current) {
    return [{ id: columnId, desc: false }];
  }

  if (!current.desc) {
    return [{ id: columnId, desc: true }];
  }

  return [];
}

export function getSortDirection(sorting: SortingState, columnId: string): SortDirection | null {
  const current = sorting.find((entry) => entry.id === columnId);

  if (!current) {
    return null;
  }

  return current.desc ? 'desc' : 'asc';
}

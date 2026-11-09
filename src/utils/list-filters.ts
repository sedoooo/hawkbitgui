import dayjs from 'dayjs';

export type ListFilterState = {
  type: string;
  dateFrom: string;
  dateTo: string;
};

export type ListFilterOption = {
  value: string;
  label: string;
};

export type ListFilterRowAccessors<T> = {
  getTypes?: (row: T) => Array<string | undefined> | undefined;
  getTimestamp?: (row: T) => number | string | null | undefined;
};

export const EMPTY_LIST_FILTERS: ListFilterState = {
  type: '',
  dateFrom: '',
  dateTo: '',
};

export const DEFAULT_LIST_FILTER_TYPE_FIELD = 'type';
export const DEFAULT_LIST_FILTER_DATE_FIELD = 'createdAt';

function escapeRsqlValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function parseDateBound(value: string, edge: 'start' | 'end'): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = dayjs(trimmed);

  if (!parsed.isValid()) {
    return undefined;
  }

  return edge === 'start' ? parsed.startOf('day').valueOf() : parsed.endOf('day').valueOf();
}

export function normalizeDateRange(state: Pick<ListFilterState, 'dateFrom' | 'dateTo'>): { from?: number; to?: number } {
  let dateFrom = state.dateFrom.trim();
  let dateTo = state.dateTo.trim();

  // `YYYY-MM-DD` strings sort lexicographically, so a reversed range can be
  // repaired before converting to epoch milliseconds.
  if (dateFrom && dateTo && dateFrom > dateTo) {
    [dateFrom, dateTo] = [dateTo, dateFrom];
  }

  const from = parseDateBound(dateFrom, 'start');
  const to = parseDateBound(dateTo, 'end');

  return { from, to };
}

export function isListFilterActive(state: ListFilterState): boolean {
  return state.type.trim() !== '' || state.dateFrom.trim() !== '' || state.dateTo.trim() !== '';
}

export function isTimestampInDateRange(timestamp: number | string | null | undefined, state: ListFilterState): boolean {
  const { from, to } = normalizeDateRange(state);

  if (from === undefined && to === undefined) {
    return true;
  }

  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return false;
  }

  const value = typeof timestamp === 'number' ? timestamp : dayjs(timestamp).valueOf();

  if (!Number.isFinite(value)) {
    return false;
  }

  if (from !== undefined && value < from) {
    return false;
  }

  if (to !== undefined && value > to) {
    return false;
  }

  return true;
}

export function buildListFilterQuery(state: ListFilterState, options?: { typeField?: string; dateField?: string }): string {
  const typeField = options?.typeField ?? DEFAULT_LIST_FILTER_TYPE_FIELD;
  const dateField = options?.dateField ?? DEFAULT_LIST_FILTER_DATE_FIELD;
  const parts: string[] = [];
  const type = state.type.trim();

  if (type) {
    parts.push(`${typeField}=="${escapeRsqlValue(type)}"`);
  }

  const { from, to } = normalizeDateRange(state);

  if (from !== undefined) {
    parts.push(`${dateField}=ge=${from}`);
  }

  if (to !== undefined) {
    parts.push(`${dateField}=le=${to}`);
  }

  return parts.join(';');
}

export function combineQueryParts(...parts: Array<string | null | undefined>): string | undefined {
  const nonEmpty = parts.filter((part): part is string => typeof part === 'string' && part.trim() !== '');

  return nonEmpty.length > 0 ? nonEmpty.join(';') : undefined;
}

export function matchesListFilters<T>(row: T, state: ListFilterState, accessors: ListFilterRowAccessors<T>): boolean {
  if (!isListFilterActive(state)) {
    return true;
  }

  const type = state.type.trim().toLowerCase();

  if (type) {
    const candidates = accessors.getTypes?.(row) ?? [];
    const matchesType = candidates.some((candidate) => typeof candidate === 'string' && candidate.toLowerCase() === type);

    if (!matchesType) {
      return false;
    }
  }

  return isTimestampInDateRange(accessors.getTimestamp?.(row), state);
}

export function filterRowsByListFilters<T>(rows: T[], state: ListFilterState, accessors: ListFilterRowAccessors<T>): T[] {
  if (!isListFilterActive(state)) {
    return rows;
  }

  return rows.filter((row) => matchesListFilters(row, state, accessors));
}

export function getDistinctTypeOptions(values: Array<string | undefined>, labelFor?: (value: string) => string): ListFilterOption[] {
  const unique = new Map<string, string>();

  values.forEach((value) => {
    if (typeof value !== 'string' || value.trim() === '') {
      return;
    }

    if (!unique.has(value)) {
      unique.set(value, labelFor ? labelFor(value) : value);
    }
  });

  return Array.from(unique.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en', { numeric: true, sensitivity: 'base' }));
}

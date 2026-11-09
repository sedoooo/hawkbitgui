import { VisibleColumn } from '@/types/utils/visible-column';

export const enableAllColumnsVisibility = (columns: Record<string, VisibleColumn>): Record<string, VisibleColumn> => {
  return Object.fromEntries(Object.entries(columns).map(([key, column]) => [key, { ...column, isSelected: true }]));
};

export const transformToColumnVisibility = (columns: Record<string, VisibleColumn>): Record<string, boolean> => {
  return Object.fromEntries(Object.entries(columns).map(([id, column]) => [id, column.isSelected]));
};

export const COLUMN_VISIBILITY_STORAGE_PREFIX = 'hawkbitgui.visible-columns';

export const getColumnVisibilityStorageKey = (tableId: string): string => `${COLUMN_VISIBILITY_STORAGE_PREFIX}.${tableId}`;

export const serializeColumnVisibility = (columns: Record<string, VisibleColumn>): string => JSON.stringify(transformToColumnVisibility(columns));

export const mergeColumnVisibility = (
  defaults: Record<string, VisibleColumn>,
  persisted: Record<string, unknown> | null | undefined
): Record<string, VisibleColumn> => {
  if (!persisted) {
    return defaults;
  }

  return Object.fromEntries(
    Object.entries(defaults).map(([id, column]) => [
      id,
      { ...column, isSelected: typeof persisted[id] === 'boolean' ? (persisted[id] as boolean) : column.isSelected },
    ])
  );
};

export const loadColumnVisibility = (storageKey: string, defaults: Record<string, VisibleColumn>): Record<string, VisibleColumn> => {
  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return defaults;
    }
    return mergeColumnVisibility(defaults, JSON.parse(rawValue) as Record<string, unknown>);
  } catch {
    return defaults;
  }
};

export const saveColumnVisibility = (storageKey: string, columns: Record<string, VisibleColumn>): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, serializeColumnVisibility(columns));
  } catch {
    // Persistence is best-effort; the in-memory column state still works.
  }
};

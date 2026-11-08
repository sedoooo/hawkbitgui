'use client';

import { useCallback, useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { toggleSortingState } from '@/utils/table-sort';

export function useTableSorting() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const toggleSort = useCallback((columnId: string) => {
    setSorting((current) => toggleSortingState(current, columnId));
  }, []);

  return { sorting, setSorting, toggleSort };
}

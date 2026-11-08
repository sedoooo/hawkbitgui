'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, ColumnDef, flexRender, VisibilityState, SortingFn } from '@tanstack/react-table';
import Skeleton from 'react-loading-skeleton';
import styles from './styles.module.scss';
import DraggableDroppableRow from '@/app/components/draggable-droppable-row';
import { isEqual } from 'lodash-es';
import { isDefined } from '@/utils/is-defined';
import type { Pagination } from '@/types/utils/pagination';
import PageNavigation from '../pagination';
import { useTableSorting } from '@/app/hooks/use-table-sorting';
import { getSortDirection, typeAwareSortingFn } from '@/utils/table-sort';

export type TableProps<T> = {
  data: T[];
  columns: ColumnDef<T, any>[];
  isLoading?: boolean;
  variant?: 'default' | 'unstyled';
  draggable?: boolean;
  selectable?: boolean;
  columnVisibility?: VisibilityState;
  pagination?: Pagination;
  onRowClick?: (rowId: string, data: T, event: React.MouseEvent) => void;
  onRowSelect?: (rowId: string, data: T) => void;
  onPageChange?: (page: number) => void;
};

export default function Table<T>({
  data,
  columns,
  isLoading = false,
  variant = 'default',
  draggable = false,
  selectable = false,
  columnVisibility: defaultColumnVisibility,
  pagination,
  onRowClick,
  onRowSelect,
  onPageChange,
}: TableProps<T>) {
  const uuid = useMemo(() => `table-${Math.random().toString(36).substr(2, 9)}`, []);
  const [selectedRows, setSelectedRows] = useState<Record<string, T>>({});
  const [columnSizing, setColumnSizing] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const { sorting, setSorting, toggleSort } = useTableSorting();

  const table = useReactTable<T>({
    data,
    columns,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    enableSorting: true,
    enableSortingRemoval: true,
    sortDescFirst: false,
    defaultColumn: {
      sortingFn: typeAwareSortingFn as SortingFn<T>,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnSizing,
      columnVisibility,
      sorting,
    },
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
  });

  useEffect(() => {
    if (isDefined(defaultColumnVisibility) && !isEqual(columnVisibility, defaultColumnVisibility)) {
      setColumnVisibility(defaultColumnVisibility);
    }
  }, [columnVisibility, defaultColumnVisibility]);

  const tableClassName = variant === 'unstyled' ? styles.unstyledTable : styles.defaultTable;

  const handleRowClick = (rowId: string, data: T, event: React.MouseEvent) => {
    let updated: Record<string, T>;

    setSelectedRows((prev) => {
      if (selectable && (event.ctrlKey || event.metaKey)) {
        if (prev[rowId] !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [rowId]: _, ...rest } = prev;
          updated = rest;
        } else {
          updated = { ...prev, [rowId]: data };
        }
      } else {
        updated = { [rowId]: data };
      }
      return updated;
    });

    onRowClick?.(rowId, data, event);
    onRowSelect?.(rowId, data);
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.tableContainer} ${tableClassName}`}>
        <div className={styles.table}>
          <div className={styles.thead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <div className={styles.tr} key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortDirection = getSortDirection(sorting, header.column.id);
                  const canSort = header.column.getCanSort();

                  return (
                    <div
                      className={styles.th}
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                      }}
                      aria-sort={sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <>
                          {canSort ? (
                            <button type='button' className={styles.sortButton} onClick={() => toggleSort(header.column.id)}>
                              <span className={styles.sortLabel}>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                              <span className={`${styles.sortIndicator} ${sortDirection ? styles.sortIndicatorActive : ''}`} aria-hidden='true'>
                                {sortDirection === 'asc' ? '▲' : sortDirection === 'desc' ? '▼' : '↕'}
                              </span>
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={styles.resizer}
                              style={{ cursor: 'col-resize' }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={styles.tbody}>
            {!isLoading ? (
              table.getRowModel().rows.map((row) => {
                const isSelected = !!selectedRows[row.id];
                return (
                  <DraggableDroppableRow
                    className={styles.tr}
                    key={row.id}
                    id={`${uuid}-${row.id}`}
                    dragData={{ ...selectedRows, [row.id]: row.original }}
                    dropData={row.original}
                    draggable={draggable}
                    droppable={draggable}
                    isSelected={isSelected}
                    onClick={(event) => handleRowClick(row.id, row.original, event)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div
                        className={styles.td}
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                          minWidth: cell.column.columnDef.minSize,
                          maxWidth: cell.column.columnDef.maxSize,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </DraggableDroppableRow>
                );
              })
            ) : (
              <Skeleton width={'100%'} height={50} count={5} />
            )}
          </div>
        </div>
      </div>
      {!isLoading && isDefined(pagination) && <PageNavigation pagination={pagination} onPageChange={onPageChange} />}
    </div>
  );
}

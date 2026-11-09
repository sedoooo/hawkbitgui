'use client';

import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import Table from '@/app/components/table';
import { Target } from '@/entities';
import dayjs from 'dayjs';
import Button from '@/app/components/button';
import TargetStatusCell from '@/app/components/target-status-cell';
import { Pagination } from '@/types/utils/pagination';
import { VisibleColumn } from '@/types/utils/visible-column';
import { transformToColumnVisibility } from '@/utils/columns-visibility';
import { TargetFilterTargetsTableColumnKey } from '@/stores/target-filter-targets-table-store';

export type TargetFilterTargetsTableProps = {
  targets: Target[];
  isLoading?: boolean;
  pagination: Pagination;
  onControllerIdClick: (controllerId: string) => void;
  onPageChange: (page: number) => void;
  visibleColumns: Partial<Record<TargetFilterTargetsTableColumnKey, VisibleColumn>>;
};

export default function TargetFilterTargetsTable({
  targets,
  isLoading = false,
  pagination,
  onControllerIdClick,
  onPageChange,
  visibleColumns,
}: TargetFilterTargetsTableProps) {
  const columnHelper = createColumnHelper<Target>();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('controllerId', {
        header: 'Target Id (Controller ID)',
        cell: (cell) => (
          <Button variant='text' onClick={() => onControllerIdClick(cell.getValue())}>
            {cell.getValue()}
          </Button>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('updateStatus', {
        header: 'Status',
        cell: (cell) => <TargetStatusCell status={cell.getValue()} />,
      }),
      columnHelper.accessor('createdBy', {
        header: 'Created by',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created Date',
        size: 250,
        cell: (info) => dayjs(info.getValue()).format('ddd MMM DD HH:mm:ss YYYY'),
      }),
      columnHelper.accessor('lastModifiedBy', {
        header: 'Modified by',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('lastModifiedAt', {
        header: 'Modified Date',
        size: 250,
        cell: (info) => dayjs(info.getValue()).format('ddd MMM DD HH:mm:ss YYYY'),
      }),
    ];
  }, [columnHelper, onControllerIdClick]);

  const columnVisibility = useMemo(() => {
    return transformToColumnVisibility(visibleColumns);
  }, [visibleColumns]);

  return (
    <Table columns={columns} columnVisibility={columnVisibility} data={targets} isLoading={isLoading} pagination={pagination} onPageChange={onPageChange} />
  );
}

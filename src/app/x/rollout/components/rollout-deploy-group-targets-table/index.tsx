'use client';

import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DeployGroupTarget } from '@/entities/rollout';
import Table from '@/app/components/table';
import dayjs from 'dayjs';
import TargetStatusCell from '@/app/components/target-status-cell';
import { VisibleColumn } from '@/types/utils/visible-column';
import { transformToColumnVisibility } from '@/utils/columns-visibility';
import { RolloutDeployGroupTargetsTableColumnKey } from '@/stores/rollout-deploy-group-targets-table-store';

export type RolloutDeployGroupTargetsTableProps = {
  deployGroupTargets: DeployGroupTarget[];
  isLoading?: boolean;
  visibleColumns: Partial<Record<RolloutDeployGroupTargetsTableColumnKey, VisibleColumn>>;
};

export default function RolloutDeployGroupTargetsTable({ deployGroupTargets, isLoading = false, visibleColumns }: RolloutDeployGroupTargetsTableProps) {
  const columnHelper = createColumnHelper<DeployGroupTarget>();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('controllerId', {
        header: 'Target Id (Controller ID)',
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('updateStatus', {
        header: 'Status',
        cell: (cell) => <TargetStatusCell status={cell.getValue()} />,
      }),
      columnHelper.accessor('createdBy', {
        header: 'Created by',
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created at',
        cell: (cell) => dayjs(cell.getValue()).format('ddd MMM DD HH:mm:ss YYYY'),
      }),
      columnHelper.accessor('lastModifiedBy', {
        header: 'Last modified by',
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('lastModifiedAt', {
        header: 'Last modified at',
        cell: (cell) => dayjs(cell.getValue()).format('ddd MMM DD HH:mm:ss YYYY'),
      }),
    ];
  }, [columnHelper]);

  const columnVisibility = useMemo(() => {
    return transformToColumnVisibility(visibleColumns);
  }, [visibleColumns]);

  return <Table columns={columns} columnVisibility={columnVisibility} data={deployGroupTargets} isLoading={isLoading} />;
}

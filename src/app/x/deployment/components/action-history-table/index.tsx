'use client';

import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import styles from './styles.module.scss';
import Table from '@/app/components/table';
import IconButton from '@/app/components/icon-button';
import dayjs from 'dayjs';
import { TargetAction } from '@/entities/target-action';
import XIcon from '@/app/components/icons/x-icon';
import ThunderCloudIcon from '@/app/components/icons/thunder-cloud-icon';
import CircleCheckMarkIcon from '@/app/components/icons/circle-check-mark-icon';
import { Chip } from '@/app/components/chip';
import { VisibleColumn } from '@/types/utils/visible-column';
import { transformToColumnVisibility } from '@/utils/columns-visibility';
import { EMPTY_DISPLAY_VALUE } from '@/utils/table-display';
import { TargetActionsTableColumnKey } from '@/stores/target-action-table-store';

export type ActionHistoryTableProps = {
  isLoading?: boolean;
  onRowClick?: (targetAction: TargetAction) => void;
  targetActions?: TargetAction[];
  onCancelClick?: (targetAction: TargetAction) => void;
  onForceClick?: (targetAction: TargetAction) => void;
  onConfirmClick?: (targetAction: TargetAction) => void;
  onActionIdClick?: (targetAction: TargetAction) => void;
  visibleColumns: Partial<Record<TargetActionsTableColumnKey, VisibleColumn>>;
};

export default function ActionHistoryTable({
  onRowClick,
  targetActions = [],
  onForceClick,
  onConfirmClick,
  onCancelClick,
  isLoading,
  onActionIdClick,
  visibleColumns,
}: ActionHistoryTableProps) {
  const columnHelper = createColumnHelper<TargetAction>();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor((row) => row.detailStatus ?? row.status, {
        id: 'status',
        header: 'Status',
        cell: (info) => (
          <div className={styles.statusCell}>
            <Chip value={info.getValue()} colorClassName={info.getValue()} />
          </div>
        ),
      }),
      columnHelper.accessor('id', {
        header: 'Action Id',
        size: 100,
        cell: (info) => (
          <button className={styles.linkButton} onClick={() => onActionIdClick?.(info.row.original)}>
            {info.getValue()}
          </button>
        ),
      }),
      columnHelper.accessor('rolloutName', {
        header: 'Rollout Name',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('_links.distributionset.name', {
        header: 'Distribution Set',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('distributionSetType', {
        header: 'Distribution Set Type',
        size: 160,
        cell: (info) => info.getValue() ?? EMPTY_DISPLAY_VALUE,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created Date',
        cell: (info) => dayjs(info.getValue()).format('YYYY-MM-DD HH:mm:ss'),
      }),
      columnHelper.accessor('createdBy', {
        header: 'Created By',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('lastModifiedAt', {
        header: 'Modified Date',
        cell: (info) => dayjs(info.getValue()).format('YYYY-MM-DD HH:mm:ss'),
      }),
      columnHelper.accessor('lastModifiedBy', {
        header: 'Modified By',
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className={styles.actionButtons}>
            {info.row.original.status === 'wait_for_confirmation' && (
              <IconButton height={'30px'} width={'30px'} title='Confirm action' onClick={() => onConfirmClick?.(info.row.original)}>
                <CircleCheckMarkIcon width={20} height={20} />
              </IconButton>
            )}
            <IconButton height={'30px'} width={'30px'} onClick={() => onForceClick?.(info.row.original)}>
              <ThunderCloudIcon />
            </IconButton>
            <IconButton height={'30px'} width={'30px'} onClick={() => onCancelClick?.(info.row.original)}>
              <XIcon />
            </IconButton>
          </div>
        ),
      }),
    ];
  }, [columnHelper, onActionIdClick, onCancelClick, onForceClick, onConfirmClick]);

  const columnVisibility = useMemo(() => {
    return transformToColumnVisibility(visibleColumns);
  }, [visibleColumns]);

  return (
    <>
      <Table
        columns={columns}
        columnVisibility={columnVisibility}
        data={targetActions}
        draggable={false}
        selectable={false}
        onRowClick={(_, data) => onRowClick?.(data)}
        isLoading={isLoading}
      />
    </>
  );
}

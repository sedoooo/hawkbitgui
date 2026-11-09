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
import ChevronDownIcon from '@/app/components/icons/chevron-down-icon';
import { Chip } from '@/app/components/chip';
import { VisibleColumn } from '@/types/utils/visible-column';
import { transformToColumnVisibility } from '@/utils/columns-visibility';
import { EMPTY_DISPLAY_VALUE } from '@/utils/table-display';
import { TargetActionsTableColumnKey } from '@/stores/target-action-table-store';
import { formatActionStatusLabel } from '@/utils/action-progress';
import { isLiveWaitingForConfirmation, resolveActionStatus, type ActionStatusOverride } from '@/utils/action-status-overrides';

export type { ActionStatusOverride } from '@/utils/action-status-overrides';

export type ActionHistoryTableProps = {
  isLoading?: boolean;
  onRowClick?: (targetAction: TargetAction) => void;
  targetActions?: TargetAction[];
  onCancelClick?: (targetAction: TargetAction) => void;
  onForceClick?: (targetAction: TargetAction) => void;
  onConfirmClick?: (targetAction: TargetAction) => void;
  onActionIdClick?: (targetAction: TargetAction) => void;
  onSelectionChange?: (targetActions: TargetAction[]) => void;
  onToggleExpand?: (targetAction: TargetAction) => void;
  renderExpandedContent?: (targetAction: TargetAction) => React.ReactNode;
  expandedActionId?: number | string;
  statusOverrides?: Record<string, ActionStatusOverride>;
  selectionResetKey?: string | number;
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
  onSelectionChange,
  onToggleExpand,
  renderExpandedContent,
  expandedActionId,
  statusOverrides,
  selectionResetKey,
  visibleColumns,
}: ActionHistoryTableProps) {
  const columnHelper = createColumnHelper<TargetAction>();

  const getEffectiveStatus = (action: TargetAction): string => {
    return resolveActionStatus(action, statusOverrides ?? {});
  };

  const columns = useMemo(() => {
    return [
      columnHelper.display({
        id: 'expand',
        header: '',
        size: 44,
        cell: (info) => {
          const isExpanded = expandedActionId !== undefined && String(expandedActionId) === String(info.row.original.id);
          return (
            <IconButton
              height={'30px'}
              width={'30px'}
              title={isExpanded ? 'Collapse action details' : 'Expand action details'}
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpand?.(info.row.original);
              }}
            >
              <ChevronDownIcon width={18} height={18} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
            </IconButton>
          );
        },
      }),
      columnHelper.accessor((row) => getEffectiveStatus(row), {
        id: 'status',
        header: 'Status',
        cell: (info) => (
          <div className={styles.statusCell} data-testid={`action-status-${info.row.original.id}`}>
            <Chip value={formatActionStatusLabel(info.getValue())} colorClassName={info.getValue()} />
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
            {isLiveWaitingForConfirmation(info.row.original, statusOverrides ?? {}) && (
              <IconButton
                height={'30px'}
                width={'30px'}
                title='Confirm action'
                data-testid={`action-confirm-${info.row.original.id}`}
                onClick={() => onConfirmClick?.(info.row.original)}
              >
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnHelper, expandedActionId, onActionIdClick, onCancelClick, onForceClick, onConfirmClick, onToggleExpand, statusOverrides]);

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
        selectable={true}
        onSelectionChange={onSelectionChange}
        selectionResetKey={selectionResetKey}
        onRowClick={(_, data) => onRowClick?.(data)}
        isLoading={isLoading}
        isRowExpanded={(action) => expandedActionId !== undefined && String(expandedActionId) === String(action.id)}
        renderExpandedRow={renderExpandedContent}
      />
    </>
  );
}

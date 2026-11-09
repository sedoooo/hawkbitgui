'use client';

import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import Table from '@/app/components/table';
import { TargetType } from '@/entities/target-type';
import EditIcon from '@/app/components/icons/edit-icon';
import TrashIcon from '@/app/components/icons/trash-icon';
import TooltipIconButton from '@/app/components/tooltip-icon-button';
import ActionIconButtons from '@/app/components/action-icon-buttons';
import { transformToColumnVisibility } from '@/utils/columns-visibility';
import { EMPTY_DISPLAY_VALUE } from '@/utils/table-display';
import { formatCompatibleDistributionSetTypes } from '@/utils/target-types';
import { VisibleColumn } from '@/types/utils/visible-column';

export type TargetTypesTableProps = {
  targetTypes: TargetType[];
  isLoading?: boolean;
  visibleColumns: Record<string, VisibleColumn>;
  onEditClick: (targetType: TargetType) => void;
  onDeleteClick: (targetType: TargetType) => void;
};

export default function TargetTypesTable({ targetTypes, isLoading, visibleColumns, onEditClick, onDeleteClick }: TargetTypesTableProps) {
  const columnHelper = createColumnHelper<TargetType>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        size: 200,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('key', {
        header: 'Key',
        size: 180,
        cell: (info) => info.getValue() ?? EMPTY_DISPLAY_VALUE,
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        size: 260,
        cell: (info) => info.getValue() || EMPTY_DISPLAY_VALUE,
      }),
      columnHelper.accessor((row) => formatCompatibleDistributionSetTypes(row.compatibleDistributionSetTypes), {
        id: 'compatibleDistributionSetTypes',
        header: 'Compatible DS Types',
        size: 280,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor((row) => row.targetCount ?? 0, {
        id: 'targetCount',
        header: 'Targets',
        size: 100,
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 100,
        cell: (info) => {
          const targetType = info.row.original;
          const inUse = (targetType.targetCount ?? 0) > 0;

          return (
            <ActionIconButtons>
              <TooltipIconButton icon={<EditIcon />} tooltipContent='Edit' iconButtonProps={{ onClick: () => onEditClick(targetType) }} />
              <TooltipIconButton
                icon={<TrashIcon />}
                tooltipContent={inUse ? `Cannot delete: ${targetType.targetCount} target(s) use this type` : 'Delete'}
                iconButtonProps={{ disabled: inUse, onClick: () => onDeleteClick(targetType) }}
              />
            </ActionIconButtons>
          );
        },
      }),
    ],
    [columnHelper, onDeleteClick, onEditClick]
  );

  const columnVisibility = useMemo(() => transformToColumnVisibility(visibleColumns), [visibleColumns]);

  return <Table columns={columns} columnVisibility={columnVisibility} data={targetTypes} draggable={false} selectable={false} isLoading={isLoading} />;
}

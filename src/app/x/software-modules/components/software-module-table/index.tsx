import React, { useMemo } from 'react';
import { createColumnHelper, SortingState } from '@tanstack/react-table';
import Table from '@/app/components/table';
import Button from '@/app/components/button';
import { SoftwareModule, SoftwareModuleKey } from '@/entities/software-module';
import TrashIcon from '@/app/components/icons/trash-icon';
import TooltipIconButton from '@/app/components/tooltip-icon-button';
import EditIcon from '@/app/components/icons/edit-icon';
import ActionIconButtons from '@/app/components/action-icon-buttons';
import { Pagination } from '@/types/utils/pagination';
import { transformToColumnVisibility } from '@/utils/columns-visibility';
import { formatUtcDateTime, resolveSoftwareModuleType, resolveSoftwareModuleVendor } from '@/utils/table-display';
import { VisibleColumn } from '@/types/utils/visible-column';

interface SoftwareModuleTableProps {
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  modules: SoftwareModule[];
  isLoading?: boolean;
  visibleColumns: Partial<Record<SoftwareModuleKey, VisibleColumn>>;
  pagination: Pagination;
  onRowClick?: (softwareModule: SoftwareModule) => void;
  onNameClick: (softwareModule: SoftwareModule) => void;
  onEditClick: (softwareModule: SoftwareModule) => void;
  onDeleteClick: (softwareModule: SoftwareModule) => void;
  onPageChange: (page: number) => void;
}

export default function SoftwareModuleTable({
  modules,
  isLoading = false,
  pagination,
  visibleColumns,
  onRowClick,
  onNameClick,
  onEditClick,
  onDeleteClick,
  onPageChange,
  sorting,
  onSortingChange,
}: SoftwareModuleTableProps) {
  const columnHelper = createColumnHelper<SoftwareModule>();

  const columnVisibility = useMemo(() => {
    return transformToColumnVisibility(visibleColumns);
  }, [visibleColumns]);

  const fullColumns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Id',
        size: 90,
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (cell) => (
          <Button variant='text' onClick={() => onNameClick(cell.row.original)}>
            {cell.getValue()}
          </Button>
        ),
      }),
      columnHelper.accessor('version', {
        header: 'Version',
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('typeName', {
        header: 'Type',
        size: 160,
        cell: (cell) => resolveSoftwareModuleType(cell.row.original),
      }),
      columnHelper.accessor('vendor', {
        header: 'Vendor',
        size: 160,
        cell: (cell) => resolveSoftwareModuleVendor(cell.row.original),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('createdBy', {
        header: 'Created By',
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created At',
        cell: (cell) => formatUtcDateTime(cell.getValue()),
      }),
      columnHelper.accessor('lastModifiedBy', {
        header: 'Last Modified By',
        size: 160,
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('lastModifiedAt', {
        header: 'Last Modified At',
        size: 160,
        cell: (cell) => formatUtcDateTime(cell.getValue()),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (cell) => (
          <ActionIconButtons>
            <TooltipIconButton icon={<EditIcon />} tooltipContent='Edit' iconButtonProps={{ onClick: () => onEditClick(cell.row.original) }} />
            <TooltipIconButton icon={<TrashIcon />} tooltipContent='Delete' iconButtonProps={{ onClick: () => onDeleteClick(cell.row.original) }} />
          </ActionIconButtons>
        ),
      }),
    ],
    [columnHelper, onNameClick, onEditClick, onDeleteClick]
  );

  return (
    <Table
      columns={fullColumns}
      data={modules}
      pagination={pagination}
      isLoading={isLoading}
      columnVisibility={columnVisibility}
      draggable={true}
      selectable={true}
      onRowClick={(_, data) => onRowClick?.(data)}
      onPageChange={onPageChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      manualSorting
    />
  );
}

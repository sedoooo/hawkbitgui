import React, { useMemo } from 'react';
import { createColumnHelper, SortingState } from '@tanstack/react-table';
import Table from '@/app/components/table';
import Button from '@/app/components/button';
import { SoftwareModule, SoftwareModuleKey } from '@/entities/software-module';
import TrashIcon from '@/app/components/icons/trash-icon';
import TooltipIconButton from '@/app/components/tooltip-icon-button';
import EditIcon from '@/app/components/icons/edit-icon';
import ChevronDownIcon from '@/app/components/icons/chevron-down-icon';
import ActionIconButtons from '@/app/components/action-icon-buttons';
import { Pagination } from '@/types/utils/pagination';
import { transformToColumnVisibility } from '@/utils/columns-visibility';
import { formatUtcDateTime, resolveSoftwareModuleType, resolveSoftwareModuleVendor } from '@/utils/table-display';
import { VisibleColumn } from '@/types/utils/visible-column';
import SoftwareModuleArtifacts from '../software-module-artifacts';

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
  expandedSoftwareModuleId?: number;
  onToggleExpanded?: (softwareModule: SoftwareModule) => void;
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
  expandedSoftwareModuleId,
  onToggleExpanded,
}: SoftwareModuleTableProps) {
  const columnHelper = createColumnHelper<SoftwareModule>();

  const columnVisibility = useMemo(() => {
    return transformToColumnVisibility(visibleColumns);
  }, [visibleColumns]);

  const fullColumns = useMemo(
    () => [
      columnHelper.display({
        id: 'expand',
        header: '',
        size: 48,
        enableSorting: false,
        cell: (cell) => {
          const isExpanded = cell.row.original.id === expandedSoftwareModuleId;
          return (
            <TooltipIconButton
              icon={
                <ChevronDownIcon
                  width={18}
                  height={18}
                  style={{ transform: isExpanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease-in-out' }}
                />
              }
              tooltipContent={isExpanded ? 'Hide artifacts' : 'Show artifacts'}
              iconButtonProps={{
                onClick: (event) => {
                  event.stopPropagation();
                  onToggleExpanded?.(cell.row.original);
                },
                'data-testid': `software-module-artifacts-toggle-${cell.row.original.id}`,
                title: isExpanded ? 'Hide artifacts' : 'Show artifacts',
              }}
            />
          );
        },
      }),
      columnHelper.accessor('id', {
        header: 'Id',
        size: 90,
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (cell) => (
          <span style={{ display: 'inline-flex' }} onClick={(event) => event.stopPropagation()}>
            <Button variant='text' onClick={() => onNameClick(cell.row.original)}>
              {cell.getValue()}
            </Button>
          </span>
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
            <TooltipIconButton
              icon={<EditIcon />}
              tooltipContent='Edit'
              iconButtonProps={{
                onClick: (event) => {
                  event.stopPropagation();
                  onEditClick(cell.row.original);
                },
              }}
            />
            <TooltipIconButton
              icon={<TrashIcon />}
              tooltipContent='Delete'
              iconButtonProps={{
                onClick: (event) => {
                  event.stopPropagation();
                  onDeleteClick(cell.row.original);
                },
              }}
            />
          </ActionIconButtons>
        ),
      }),
    ],
    [columnHelper, expandedSoftwareModuleId, onNameClick, onEditClick, onDeleteClick, onToggleExpanded]
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
      isRowExpanded={(softwareModule) => softwareModule.id === expandedSoftwareModuleId}
      renderExpandedRow={(softwareModule) => <SoftwareModuleArtifacts softwareModuleId={softwareModule.id} />}
    />
  );
}

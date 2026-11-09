'use client';

import { useState } from 'react';
import Button from '@/app/components/button';
import ManageColumnsButton from '@/app/components/manage-columns-button';
import PanelCard from '@/app/components/panel-card';
import { TargetType } from '@/entities/target-type';
import TargetTypesTable from '../target-types-table';
import { DEFAULT_TARGET_TYPES_TABLE_VISIBLE_COLUMNS, TARGET_TYPES_TABLE_VISIBLE_COLUMNS_STORAGE_KEY } from '../../utils/columns';
import { VisibleColumn } from '@/types/utils/visible-column';

export type TargetTypesCardProps = {
  targetTypes: TargetType[];
  isLoading?: boolean;
  onCreateClick: () => void;
  onEditClick: (targetType: TargetType) => void;
  onDeleteClick: (targetType: TargetType) => void;
};

export default function TargetTypesCard({ targetTypes, isLoading, onCreateClick, onEditClick, onDeleteClick }: TargetTypesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, VisibleColumn>>(DEFAULT_TARGET_TYPES_TABLE_VISIBLE_COLUMNS);

  return (
    <PanelCard defaultWidth='100%' expanded={isExpanded}>
      <PanelCard.Header title='Target Types' isExpanded={isExpanded} onToggleExpand={() => setIsExpanded((prev) => !prev)} />

      <PanelCard.Actions>
        <Button onClick={onCreateClick}>+ New target type</Button>
        <ManageColumnsButton columns={visibleColumns} setVisibleColumns={setVisibleColumns} storageKey={TARGET_TYPES_TABLE_VISIBLE_COLUMNS_STORAGE_KEY} />
      </PanelCard.Actions>

      <PanelCard.Content>
        <TargetTypesTable
          targetTypes={targetTypes}
          isLoading={isLoading}
          visibleColumns={visibleColumns}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      </PanelCard.Content>
    </PanelCard>
  );
}

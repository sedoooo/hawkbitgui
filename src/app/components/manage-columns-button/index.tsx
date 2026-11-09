'use client';

import type React from 'react';

import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.scss';
import ChevronDownIcon from '../icons/chevron-down-icon';
import Button from '../button';
import XIcon from '../icons/x-icon';
import IconButton from '../icon-button';
import { VisibleColumn } from '@/types/utils/visible-column';
import Text from '../text';
import { loadColumnVisibility, saveColumnVisibility } from '@/utils/columns-visibility';

export interface ManageColumnsButtonProps {
  columns: Record<string, VisibleColumn>;
  setVisibleColumns: (columns: Record<string, VisibleColumn>) => void;
  storageKey?: string;
}

export default function ManageColumnsButton(props: ManageColumnsButtonProps) {
  const { columns, setVisibleColumns, storageKey } = props;
  const [open, setOpen] = useState(false);
  const loadedStorageKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!storageKey || loadedStorageKeyRef.current === storageKey) {
      return;
    }
    loadedStorageKeyRef.current = storageKey;
    setVisibleColumns(loadColumnVisibility(storageKey, columns));
  }, [columns, storageKey, setVisibleColumns]);

  const updateVisibleColumns = (nextColumns: Record<string, VisibleColumn>) => {
    setVisibleColumns(nextColumns);
    if (storageKey) {
      saveColumnVisibility(storageKey, nextColumns);
    }
  };

  const toggleColumn = (id: string) => {
    const column = columns[id];
    updateVisibleColumns({
      ...columns,
      [id]: { ...column, isSelected: !column.isSelected },
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setOpen(false);
    }
  };

  const handleSelectAll = () => {
    updateVisibleColumns(Object.fromEntries(Object.entries(columns).map(([id, column]) => [id, { ...column, isSelected: true }])));
  };

  const handleDeselectAll = () => {
    updateVisibleColumns(Object.fromEntries(Object.entries(columns).map(([id, column]) => [id, { ...column, isSelected: false }])));
  };

  return (
    <div className={styles.manageColumnsContainer}>
      <Button variant='ghost' rightIcon={<ChevronDownIcon width={18} height={18} />} onClick={() => setOpen(true)}>
        Manage columns
      </Button>

      {open && (
        <>
          <div className={styles.dialogOverlay} onClick={handleOverlayClick} />
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <Text variant='heading-2'>Manage Columns</Text>
              <IconButton onClick={() => setOpen(false)}>
                <XIcon width={24} height={24} />
              </IconButton>
            </div>

            <div className={styles.columnsContainer}>
              {Object.values(columns).map((column) => (
                <Button key={column.id} variant={column.isSelected ? 'default' : 'outline'} onClick={() => toggleColumn(column.id)}>
                  {column.label}
                </Button>
              ))}
            </div>

            <div className={styles.actionsContainer}>
              <Button variant='ghost' color='secondary' onClick={handleSelectAll}>
                Select all
              </Button>
              <Button variant='ghost' color='danger' onClick={handleDeselectAll}>
                Deselect all
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

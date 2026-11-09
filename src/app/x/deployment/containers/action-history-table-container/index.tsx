'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ActionHistoryTable from '@/app/x/deployment/components/action-history-table';
import { useTargetActionsTableStore } from '@/stores/target-action-table-store';
import { TargetAction } from '@/entities/target-action';
import { Modal } from '@/app/components/modal';
import { useModal } from '@/app/hooks';
import ActionInfo from '@/app/x/deployment/components/action-info';
import ConfirmationModal from '@/app/components/confirmation-modal';
import { useConfirmDialog } from '@/app/hooks/use-confirm-dialog';
import { TargetsService } from '@/services/targets-service';
import { handleErrorWithToast } from '@/utils/handle-error-with-toast';
import ListFilterBar from '@/app/components/list-filter-bar';
import { EMPTY_LIST_FILTERS, filterRowsByListFilters, getDistinctTypeOptions, type ListFilterState } from '@/utils/list-filters';

export default function ActionHistoryTableContainer() {
  const targetActions = useTargetActionsTableStore((state) => state.actions);
  const isLoading = useTargetActionsTableStore((state) => state.isLoading);
  const visibleColumns = useTargetActionsTableStore((state) => state.visibleColumns);
  const fetchTargetActions = useTargetActionsTableStore((state) => state.fetchActions);
  const pollTargetActions = useTargetActionsTableStore((state) => state.pollActions);
  const selectedTargetId = useTargetActionsTableStore((state) => state.selectedTargetId);
  const setSelectedAction = useTargetActionsTableStore((state) => state.setSelectedAction);

  const { isOpen, open, close } = useModal();

  const [listFilters, setListFilters] = useState<ListFilterState>(EMPTY_LIST_FILTERS);

  const typeOptions = useMemo(() => {
    const values = targetActions.flatMap((action) => [
      action.type ? `action:${action.type}` : undefined,
      action.distributionSetType ? `ds:${action.distributionSetType}` : undefined,
    ]);

    return getDistinctTypeOptions(values, (value) => {
      if (value.startsWith('action:')) {
        return `Action: ${value.slice('action:'.length)}`;
      }
      if (value.startsWith('ds:')) {
        return `Distribution set: ${value.slice('ds:'.length)}`;
      }
      return value;
    });
  }, [targetActions]);

  const filteredTargetActions = useMemo(
    () =>
      filterRowsByListFilters(targetActions, listFilters, {
        getTypes: (action) => [action.type ? `action:${action.type}` : undefined, action.distributionSetType ? `ds:${action.distributionSetType}` : undefined],
        getTimestamp: (action) => action.createdAt,
      }),
    [targetActions, listFilters]
  );

  const [isCancelling, setIsCancelling] = useState(false);
  const confirmCancelDialog = useConfirmDialog<TargetAction>();
  const confirmForceDialog = useConfirmDialog<TargetAction>();
  const confirmActionDialog = useConfirmDialog<TargetAction>();

  const handleActionIdClick = (targetAction: TargetAction) => {
    if (!selectedTargetId) {
      console.warn('No target ID selected. Skipping action history fetch.');
      return;
    }
    setSelectedAction(targetAction);
    open();
  };

  const handleCancelClick = (targetAction: TargetAction) => {
    confirmCancelDialog.open(targetAction, async () => {
      if (!selectedTargetId) return;
      setIsCancelling(true);
      try {
        await TargetsService.cancelAction(selectedTargetId, targetAction.id);
        fetchTargetActions(selectedTargetId);
      } catch (e) {
        handleErrorWithToast(e, 'Failed to cancel action');
      } finally {
        setIsCancelling(false);
      }
    });
  };

  const handleConfirmClick = (targetAction: TargetAction) => {
    confirmActionDialog.open(targetAction, async () => {
      if (!selectedTargetId) return;
      setIsCancelling(true);
      try {
        await TargetsService.confirmAction(selectedTargetId, targetAction.id);
        fetchTargetActions(selectedTargetId);
      } catch (e) {
        handleErrorWithToast(e, 'Failed to confirm action');
      } finally {
        setIsCancelling(false);
      }
    });
  };

  const handleForceClick = (targetAction: TargetAction) => {
    confirmForceDialog.open(targetAction, async () => {
      if (!selectedTargetId) return;
      setIsCancelling(true);
      try {
        await TargetsService.targetForceAction(selectedTargetId, targetAction.id);
        fetchTargetActions(selectedTargetId);
      } catch (e) {
        handleErrorWithToast(e, 'Failed to force action');
      } finally {
        setIsCancelling(false);
      }
    });
  };

  useEffect(() => {
    if (!selectedTargetId) {
      console.warn('No target ID selected. Skipping action history fetch.');
      return;
    }
    fetchTargetActions(selectedTargetId).catch(console.error);
    const interval = setInterval(() => {
      pollTargetActions(selectedTargetId).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTargetActions, pollTargetActions, selectedTargetId]);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <ListFilterBar
          filters={listFilters}
          typeOptions={typeOptions}
          typeLabel='Type'
          onChange={setListFilters}
          onReset={() => setListFilters({ ...EMPTY_LIST_FILTERS })}
          testIdPrefix='action-history-filter'
        />
        <ActionHistoryTable
          targetActions={filteredTargetActions}
          visibleColumns={visibleColumns}
          isLoading={isLoading}
          onActionIdClick={handleActionIdClick}
          onCancelClick={handleCancelClick}
          onForceClick={handleForceClick}
          onConfirmClick={handleConfirmClick}
        />
      </div>
      <Modal isOpen={isOpen} variant='unstyled' size='lg' onClose={close}>
        <ActionInfo />
      </Modal>
      <ConfirmationModal
        isOpen={confirmCancelDialog.isOpen}
        onClose={confirmCancelDialog.close}
        onConfirm={confirmCancelDialog.confirm}
        title='Cancel Action'
        confirmButtonText={isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
        cancelButtonText='No'
        size='sm'
      >
        <p>Are you sure you want to cancel this action?</p>
      </ConfirmationModal>
      <ConfirmationModal
        isOpen={confirmActionDialog.isOpen}
        onClose={confirmActionDialog.close}
        onConfirm={confirmActionDialog.confirm}
        title='Confirm Action'
        confirmButtonText={isCancelling ? 'Confirming...' : 'Yes, Confirm'}
        cancelButtonText='No'
        size='sm'
      >
        <p>Are you sure you want to confirm this action and start the deployment?</p>
      </ConfirmationModal>
      <ConfirmationModal
        isOpen={confirmForceDialog.isOpen}
        onClose={confirmForceDialog.close}
        onConfirm={confirmForceDialog.confirm}
        title='Force Action'
        confirmButtonText={isCancelling ? 'Forcing...' : 'Yes'}
        cancelButtonText='No'
        size='sm'
      >
        <p>Are you sure you want to force?</p>
      </ConfirmationModal>
    </>
  );
}

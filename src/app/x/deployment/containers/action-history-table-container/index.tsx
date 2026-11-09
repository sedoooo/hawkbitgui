'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ActionHistoryTable from '@/app/x/deployment/components/action-history-table';
import ActionProgressPanel from '@/app/x/deployment/components/action-progress-panel';
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
import Button from '@/app/components/button';
import { toast } from 'react-hot-toast';
import { isErrorWithMessage } from '@/utils/is-error-with-message';
import { type ActionStatusOverrides, pruneActionStatusOverrides, removeActionStatusOverride, setActionStatusOverride } from '@/utils/action-status-overrides';
import { describeConfirmFailure, getHttpStatus, summarizeBulkConfirm, formatBulkConfirmSummary } from '@/utils/action-confirmation';

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
  const [expandedActionId, setExpandedActionId] = useState<number | string | undefined>(undefined);
  const [statusOverrides, setStatusOverrides] = useState<ActionStatusOverrides>({});

  const handleToggleExpand = (targetAction: TargetAction) => {
    setExpandedActionId((current) => (current !== undefined && String(current) === String(targetAction.id) ? undefined : targetAction.id));
  };

  // Live status from an expanded panel is keyed by action id, so expanding one
  // row can never change the status shown for another row.
  const handleStatusUpdate = useCallback((actionId: number | string, status: string) => {
    setStatusOverrides((current) => setActionStatusOverride(current, actionId, status));
  }, []);

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
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBulkConfirming, setIsBulkConfirming] = useState(false);
  const [isForcing, setIsForcing] = useState(false);
  const [selectedActions, setSelectedActions] = useState<TargetAction[]>([]);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const confirmCancelDialog = useConfirmDialog<TargetAction>();
  const confirmForceDialog = useConfirmDialog<TargetAction>();
  const confirmActionDialog = useConfirmDialog<TargetAction>();
  const confirmBulkDialog = useConfirmDialog<TargetAction[]>();

  const confirmableSelectedActions = useMemo(() => selectedActions.filter((action) => action.status === 'wait_for_confirmation'), [selectedActions]);

  const clearSelection = () => {
    setSelectedActions([]);
    setSelectionResetKey((key) => key + 1);
  };

  const refreshActionState = useCallback(async () => {
    if (!selectedTargetId) {
      return undefined;
    }
    await fetchTargetActions(selectedTargetId);
    return useTargetActionsTableStore.getState().actions;
  }, [fetchTargetActions, selectedTargetId]);

  const findAction = (actions: TargetAction[] | undefined, actionId: number | string) => actions?.find((action) => String(action.id) === String(actionId));

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
      setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
      try {
        await TargetsService.cancelAction(selectedTargetId, targetAction.id);
        await refreshActionState();
        setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
        clearSelection();
        toast.success('Action cancelled');
      } catch (e) {
        await refreshActionState();
        setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
        handleErrorWithToast(e, 'Failed to cancel action');
      } finally {
        setIsCancelling(false);
      }
    });
  };

  const handleConfirmClick = (targetAction: TargetAction) => {
    confirmActionDialog.open(targetAction, async () => {
      if (!selectedTargetId) return;
      setIsConfirming(true);
      // Drop any live override first so the row cannot keep showing a stale
      // "waiting" state after the confirmation has been processed.
      setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
      try {
        await TargetsService.confirmAction(selectedTargetId, targetAction.id);
        await refreshActionState();
        setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
        clearSelection();
        toast.success('Action confirmed');
      } catch (e) {
        // A second/duplicate confirmation returns 400/404/409 (often with an
        // empty body). Refresh the real state and report it instead of a
        // generic failure.
        const actions = await refreshActionState();
        setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
        const currentAction = findAction(actions, targetAction.id);
        toast.error(
          describeConfirmFailure({
            httpStatus: getHttpStatus(e),
            message: isErrorWithMessage(e) ? e.message : undefined,
            currentStatus: currentAction?.detailStatus ?? currentAction?.status,
          })
        );
      } finally {
        setIsConfirming(false);
      }
    });
  };

  const handleBulkConfirmClick = () => {
    if (confirmableSelectedActions.length === 0) {
      toast.error('Select at least one action that is waiting for confirmation');
      return;
    }

    confirmBulkDialog.open(confirmableSelectedActions, async () => {
      if (!selectedTargetId) return;
      setIsBulkConfirming(true);
      confirmableSelectedActions.forEach((targetAction) => {
        setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
      });
      try {
        const results = await Promise.allSettled(
          confirmableSelectedActions.map((targetAction) => TargetsService.confirmAction(selectedTargetId, targetAction.id))
        );
        const actions = await refreshActionState();
        confirmableSelectedActions.forEach((targetAction) => {
          setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
        });

        const outcomes = results.map((result, index) => {
          const confirmedAction = findAction(actions, confirmableSelectedActions[index].id);
          if (result.status === 'fulfilled') {
            return { fulfilled: true };
          }
          return {
            fulfilled: false,
            httpStatus: getHttpStatus(result.reason),
            message: isErrorWithMessage(result.reason) ? result.reason.message : undefined,
            currentStatus: confirmedAction?.detailStatus ?? confirmedAction?.status,
          };
        });

        const summary = summarizeBulkConfirm(outcomes);
        if (summary.failed === 0 && summary.notWaiting === 0) {
          toast.success(formatBulkConfirmSummary(summary));
        } else {
          toast(formatBulkConfirmSummary(summary));
        }

        clearSelection();
      } catch (e) {
        handleErrorWithToast(e, 'Failed to confirm selected actions');
      } finally {
        setIsBulkConfirming(false);
      }
    });
  };

  const handleForceClick = (targetAction: TargetAction) => {
    confirmForceDialog.open(targetAction, async () => {
      if (!selectedTargetId) return;
      setIsForcing(true);
      setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
      try {
        await TargetsService.targetForceAction(selectedTargetId, targetAction.id);
        await refreshActionState();
        setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
        clearSelection();
        toast.success('Action forced');
      } catch (e) {
        await refreshActionState();
        setStatusOverrides((current) => removeActionStatusOverride(current, targetAction.id));
        handleErrorWithToast(e, 'Failed to force action');
      } finally {
        setIsForcing(false);
      }
    });
  };

  useEffect(() => {
    setExpandedActionId(undefined);
    setStatusOverrides({});
  }, [selectedTargetId]);

  // Keep live overrides scoped to actions that are still present and active.
  useEffect(() => {
    setStatusOverrides((current) => pruneActionStatusOverrides(current, targetActions));
  }, [targetActions]);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#707070' }}>
            {selectedActions.length > 0
              ? `${selectedActions.length} selected${confirmableSelectedActions.length > 0 ? ` (${confirmableSelectedActions.length} awaiting confirmation)` : ''}`
              : 'Select rows with Ctrl/Cmd + click to confirm in bulk'}
          </span>
          <Button variant='outline' disabled={confirmableSelectedActions.length === 0} onClick={handleBulkConfirmClick}>
            Confirm selected{confirmableSelectedActions.length > 0 ? ` (${confirmableSelectedActions.length})` : ''}
          </Button>
        </div>
        <ActionHistoryTable
          targetActions={filteredTargetActions}
          visibleColumns={visibleColumns}
          isLoading={isLoading}
          onActionIdClick={handleActionIdClick}
          onCancelClick={handleCancelClick}
          onForceClick={handleForceClick}
          onConfirmClick={handleConfirmClick}
          onSelectionChange={setSelectedActions}
          selectionResetKey={selectionResetKey}
          expandedActionId={expandedActionId}
          onToggleExpand={handleToggleExpand}
          statusOverrides={statusOverrides}
          renderExpandedContent={
            selectedTargetId
              ? (targetAction) => (
                  <ActionProgressPanel
                    key={`${selectedTargetId}:${targetAction.id}`}
                    action={targetAction}
                    controllerId={selectedTargetId}
                    onStatusUpdate={handleStatusUpdate}
                  />
                )
              : undefined
          }
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
        confirmButtonText={isConfirming ? 'Confirming...' : 'Yes, Confirm'}
        cancelButtonText='No'
        size='sm'
      >
        <p>Are you sure you want to confirm this action and start the deployment?</p>
      </ConfirmationModal>
      <ConfirmationModal
        isOpen={confirmBulkDialog.isOpen}
        onClose={confirmBulkDialog.close}
        onConfirm={confirmBulkDialog.confirm}
        title='Confirm Selected Actions'
        confirmButtonText={isBulkConfirming ? 'Confirming...' : 'Yes, Confirm all'}
        cancelButtonText='No'
        size='sm'
      >
        <p>Are you sure you want to confirm {confirmableSelectedActions.length} selected action(s) and start the deployment?</p>
      </ConfirmationModal>
      <ConfirmationModal
        isOpen={confirmForceDialog.isOpen}
        onClose={confirmForceDialog.close}
        onConfirm={confirmForceDialog.confirm}
        title='Force Action'
        confirmButtonText={isForcing ? 'Forcing...' : 'Yes'}
        cancelButtonText='No'
        size='sm'
      >
        <p>Are you sure you want to force?</p>
      </ConfirmationModal>
    </>
  );
}

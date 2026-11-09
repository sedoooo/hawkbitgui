'use client';

import styles from './styles.module.scss';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import TargetsCardContainer from '@/app/x/deployment/containers/targets-card-container';
import DistributionsCardContainer from '@/app/x/deployment/containers/distributions-card-container';
import { Distribution, isDistribution, isDistributionRecord, isTarget, isTargetRecord, Target } from '@/entities';
import { useRef, useState } from 'react';
import DraggedItemPreview from '@/app/components/dragged-item-preview';
import { TargetsService } from '@/services/targets-service';
import { handleErrorWithToast } from '@/utils/handle-error-with-toast';
import { DistributionSetsService } from '@/services/distribution-sets-service';
import ConfirmationModal from '@/app/components/confirmation-modal';
import { useConfirmDialog } from '@/app/hooks';
import ScheduleForm, { FormData as ScheduleFormData } from '@/app/x/deployment/components/schedule-form';
import { AssignConfig, AssignmentAction } from '@/services/targets-service.types';
import ActionHistoryCardContainer from '@/app/x/deployment/containers/action-history-card-container';
import { useTargetActionsTableStore } from '@/stores/target-action-table-store';
import { ExpandableCardProvider } from '@/app/components/card/expandable-card-context';
import { buildAssignmentFeedback } from '@/utils/assignment-feedback';
import { toast } from 'react-hot-toast';
import { Modal } from '@/app/components/modal';
import { ActionButtons } from '@/app/components/action-buttons';
import { buildTwinDistributionSetInput, findTwinDistributionSet, getDistributionModuleIds } from '@/utils/twin-distribution-set';
import { isAutoConfirmAssignmentsEnabled } from '@/utils/auto-confirm';
import type { CreateDistributionSetInput } from '@/services/distribution-sets-services.types';

const mapScheduleFormDataToAssignConfig = (id: string | number, data?: ScheduleFormData): AssignConfig => {
  if (!data) {
    return {
      id: id,
      confirmationRequired: false,
    };
  }
  const assignConfig: AssignConfig = {
    type: data.mode,
    confirmationRequired: false,
    maintenanceWindow: data.maintenanceWindow
      ? {
          schedule: data.schedule,
          duration: data.duration,
          timezone: data.timeZone,
        }
      : undefined,
    id: id,
  };
  if (data.mode === 'timeforced' && data.forcedDate) {
    assignConfig.forcetime = new Date(data.forcedDate).getTime();
  }
  return assignConfig;
};

const resolveActionTargetId = (action: AssignmentAction, fallback?: string): string | undefined => {
  const href = action._links?.target?.href;
  if (!href) {
    return fallback;
  }
  const segment = href.split('/').filter(Boolean).pop();
  return segment ? decodeURIComponent(segment) : fallback;
};

// Optional auto-confirm for assignments. Off by default: silently confirming an
// action races the manual Confirm button and makes it look like confirmation
// failed. Opt in with NEXT_PUBLIC_HAWKBITGUI_AUTO_CONFIRM=true at build time.
const confirmPendingAssignmentActions = async (actions: AssignmentAction[], fallbackTargetIds: (string | undefined)[]) => {
  if (!isAutoConfirmAssignmentsEnabled()) {
    return;
  }
  for (const [index, action] of actions.entries()) {
    if (action.status !== 'wait_for_confirmation') {
      continue;
    }
    const controllerId = resolveActionTargetId(action, fallbackTargetIds[index]);
    if (!controllerId) {
      console.warn('Could not resolve target for pending confirmation action', action.id);
      continue;
    }
    try {
      await TargetsService.confirmAction(controllerId, action.id);
    } catch (error) {
      handleErrorWithToast(error, 'Failed to confirm assignment');
    }
  }
};

type ForceReinstallState = {
  targetIds: string[];
  targetLabel: string;
  twins: { source: Distribution; twin: Distribution }[];
  missing: { source: Distribution; proposed: CreateDistributionSetInput }[];
};

export default function DeploymentDndLayoutContainer() {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const targetOverDistributionConfirmationModal = useConfirmDialog<{ targets: Target[]; distributions: Distribution[] }>();

  const scheduleFormData = useRef<ScheduleFormData | undefined>(undefined);
  const fetchActions = useTargetActionsTableStore((state) => state.fetchActions);
  const setSelectedTargetId = useTargetActionsTableStore((state) => state.setSelectedTargetId);

  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingDistribution, setIsDraggingDistribution] = useState(false);
  const [forceReinstallState, setForceReinstallState] = useState<ForceReinstallState | null>(null);
  const [isForceReinstalling, setIsForceReinstalling] = useState(false);
  const draggedTargets = useRef<Target[]>([]);
  const draggedDistributions = useRef<Distribution[]>([]);

  function handleDragStart(event: DragStartEvent) {
    const draggedData = event.active.data.current?.dragData;
    setIsDragging(true);

    console.log('isDistributionRecord', isDistributionRecord(draggedData), 'isTargetRecord', isTargetRecord(draggedData));
    console.log('draggedData', draggedData);

    if (isTargetRecord(draggedData)) {
      draggedTargets.current = Object.values(draggedData);
      draggedDistributions.current = [];
    }
    if (isDistributionRecord(draggedData)) {
      setIsDraggingDistribution(true);
      draggedDistributions.current = Object.values(draggedData);
      draggedTargets.current = [];
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragged = event.active.data.current?.dragData;
    const over = event.over?.data.current?.dropData;

    if (!dragged || !over) {
      setIsDragging(false);
      return;
    }

    if (isDistributionRecord(dragged) && isTarget(over)) {
      console.log('distributions over target');
      const distributions = Object.values(dragged);
      const target = over;
      targetOverDistributionConfirmationModal.open({ targets: [target], distributions }, () => {
        handleDistributionOverTarget(distributions, target, scheduleFormData.current);
      });

      setIsDragging(false);
      setIsDraggingDistribution(true);
      return;
    }

    if (isTargetRecord(dragged) && isDistribution(over)) {
      console.log('targets over distribution');
      const targets = Object.values(dragged);
      const distribution = over;
      targetOverDistributionConfirmationModal.open({ targets, distributions: [distribution] }, () => {
        handleTargetOverDistribution(targets, distribution, scheduleFormData.current);
      });
      setIsDragging(false);
      setIsDraggingDistribution(false);
      return;
    }

    setIsDragging(false);
    setIsDraggingDistribution(false);
  }

  async function handleDistributionOverTarget(distributions: Distribution[], target: Target, scheduleData?: ScheduleFormData) {
    console.log('distribution over target', distributions, target);
    const configs = distributions.map((distribution) => mapScheduleFormDataToAssignConfig(distribution.id, scheduleData));
    try {
      const createdActions = await TargetsService.assignDistributionsToTarget({
        controllerId: target.controllerId,
        distributionsConfigs: configs,
      });
      const pendingActions = createdActions.assignedActions ?? [];
      await confirmPendingAssignmentActions(
        pendingActions,
        pendingActions.map(() => target.controllerId)
      );
      const feedback = buildAssignmentFeedback(createdActions, distributions.map((item) => item.name).join(', '), `target ${target.name}`);
      if (feedback.tone === 'success') {
        toast.success(feedback.message);
      } else {
        toast(feedback.message);
        if ((createdActions.assigned ?? 0) === 0 && (createdActions.alreadyAssigned ?? 0) > 0) {
          await offerForceReinstall(distributions, [target.controllerId], `target ${target.name}`);
        }
      }
      setSelectedTargetId(target.controllerId);
      fetchActions(target.controllerId);
    } catch (error) {
      handleErrorWithToast(error, 'Failed to assign distribution to target');
    }
  }

  async function handleTargetOverDistribution(targets: Target[], distribution: Distribution, scheduleData?: ScheduleFormData) {
    console.log('target over distribution', targets, distribution);
    const configs = targets.map((target) => mapScheduleFormDataToAssignConfig(target.controllerId, scheduleData));
    try {
      const createdActions = await DistributionSetsService.assignTargetsToDistributionSet({
        distributionId: distribution.id,
        targetConfigs: configs,
      });
      const pendingActions = createdActions.assignedActions ?? [];
      await confirmPendingAssignmentActions(
        pendingActions,
        pendingActions.map((_, index) => targets[index]?.controllerId)
      );
      const feedback = buildAssignmentFeedback(createdActions, distribution.name, targets.length === 1 ? `target ${targets[0]?.name}` : undefined);
      if (feedback.tone === 'success') {
        toast.success(feedback.message);
      } else {
        toast(feedback.message);
        if ((createdActions.assigned ?? 0) === 0 && (createdActions.alreadyAssigned ?? 0) > 0) {
          await offerForceReinstall(
            [distribution],
            targets.map((target) => target.controllerId),
            targets.length === 1 ? `target ${targets[0]?.name}` : `${targets.length} targets`
          );
        }
      }
      const firstTarget = targets[0];
      if (firstTarget) {
        setSelectedTargetId(firstTarget.controllerId);
        fetchActions(firstTarget.controllerId);
      }
    } catch (error) {
      handleErrorWithToast(error, 'Failed to assign target to Distribution Set');
    }
  }

  async function offerForceReinstall(distributions: Distribution[], targetIds: string[], targetLabel: string) {
    try {
      const { distributionSets } = await DistributionSetsService.fetchDistributionSets(undefined, { offset: 0, limit: 1000 });
      const resolvedDistributions = distributions.map((distribution) => distributionSets.find((candidate) => candidate.id === distribution.id) ?? distribution);
      const twins: { source: Distribution; twin: Distribution }[] = [];
      const missing: { source: Distribution; proposed: CreateDistributionSetInput }[] = [];

      for (const distribution of resolvedDistributions) {
        const twin = findTwinDistributionSet(distribution, distributionSets);
        if (twin) {
          twins.push({ source: distribution, twin });
          continue;
        }

        let source = distribution;
        if (getDistributionModuleIds(source).length === 0) {
          const modules = await DistributionSetsService.getAssignedSoftwareModules(source.id);
          source = { ...source, modules };
        }
        missing.push({ source, proposed: buildTwinDistributionSetInput(source, distributionSets) });
      }

      setForceReinstallState({ targetIds, targetLabel, twins, missing });
    } catch (error) {
      handleErrorWithToast(error, 'Failed to look up or prepare a byte-identical twin distribution set');
    }
  }

  async function handleForceReinstall() {
    if (!forceReinstallState || (forceReinstallState.twins.length === 0 && forceReinstallState.missing.length === 0)) {
      return;
    }

    setIsForceReinstalling(true);
    const createdTwins: Distribution[] = [];
    try {
      const twinsToAssign = forceReinstallState.twins.map(({ twin }) => twin);

      for (const { proposed } of forceReinstallState.missing) {
        const createdTwin = await DistributionSetsService.createDistributionSet([proposed]);
        createdTwins.push(createdTwin);
        twinsToAssign.push(createdTwin);
      }

      const assignedActions: AssignmentAction[] = [];
      const actionFallbackTargetIds: (string | undefined)[] = [];

      for (const twin of twinsToAssign) {
        const result = await DistributionSetsService.assignTargetsToDistributionSet({
          distributionId: twin.id,
          targetConfigs: forceReinstallState.targetIds.map((targetId) => ({ id: targetId, type: 'forced', confirmationRequired: false })),
        });
        const actions = result.assignedActions ?? [];
        assignedActions.push(...actions);
        actionFallbackTargetIds.push(...actions.map((_, index) => forceReinstallState.targetIds[index % forceReinstallState.targetIds.length]));
      }

      await confirmPendingAssignmentActions(assignedActions, actionFallbackTargetIds);

      const firstTargetId = forceReinstallState.targetIds[0];
      let actionSummary = 'no actions reported';

      if (firstTargetId && assignedActions.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const refreshedActions = await TargetsService.fetchActions(firstTargetId);
        const actionById = new Map(refreshedActions.map((action) => [action.id, action]));
        actionSummary = assignedActions.map((action) => `#${action.id} ${actionById.get(action.id)?.status ?? action.status ?? 'pending'}`).join(', ');
      }

      const twinSummary = twinsToAssign.map((twin) => `${twin.name} (id ${twin.id})`).join(', ');
      const createdSummary =
        createdTwins.length > 0 ? `Created twin ${createdTwins.map((twin) => `${twin.name} (id ${twin.id}, version ${twin.version})`).join(', ')}. ` : '';
      toast.success(`${createdSummary}Forced reinstall started with ${twinSummary}. Actions: ${actionSummary}`);

      if (firstTargetId) {
        setSelectedTargetId(firstTargetId);
        fetchActions(firstTargetId);
      }
      setForceReinstallState(null);
    } catch (error) {
      const createdSummary =
        createdTwins.length > 0
          ? `Created twin ${createdTwins.map((twin) => `${twin.name} (id ${twin.id})`).join(', ')} but failed to start the forced reinstall`
          : 'Failed to start the forced reinstall';
      handleErrorWithToast(error, createdSummary);
    } finally {
      setIsForceReinstalling(false);
    }
  }

  return (
    <ExpandableCardProvider>
      <div className={styles.cardsContainer}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <TargetsCardContainer />
          <DistributionsCardContainer />
          <ActionHistoryCardContainer />
          <DragOverlay>
            {isDragging ? (
              <DraggedItemPreview
                name={isDraggingDistribution ? draggedDistributions.current[0]?.name : draggedTargets.current[0]?.name}
                count={isDraggingDistribution ? draggedDistributions.current.length : draggedTargets.current.length}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
        <ConfirmationModal
          size={'lg'}
          title={'Confirm Assignment'}
          onClose={targetOverDistributionConfirmationModal.close}
          onConfirm={targetOverDistributionConfirmationModal.confirm}
          isOpen={targetOverDistributionConfirmationModal.isOpen}
        >
          {isDraggingDistribution ? (
            <p>
              Are you sure you want to assign if Distribution set <b>{targetOverDistributionConfirmationModal.data?.distributions[0].name}</b> to Target{' '}
              <b>{targetOverDistributionConfirmationModal.data?.targets[0].name}</b> ?
            </p>
          ) : (
            <p>
              Are you sure you want to assign if Target <b>{targetOverDistributionConfirmationModal.data?.targets[0].name}</b> to Distribution set{' '}
              <b>{targetOverDistributionConfirmationModal.data?.distributions[0].name}</b> ?
            </p>
          )}
          <ScheduleForm onChange={(data) => (scheduleFormData.current = data)} />
        </ConfirmationModal>
        <Modal isOpen={forceReinstallState !== null} onClose={() => setForceReinstallState(null)} size={'md'}>
          <Modal.Header>Force reinstall</Modal.Header>
          <Modal.Content>
            <p>The selected distribution set is already assigned to {forceReinstallState?.targetLabel}. A normal assignment is a no-op, so nothing changed.</p>
            <p>
              A forced reinstall assigns a byte-identical twin distribution set (same software modules) with a forced action, so the target downloads and
              installs the same content again.
            </p>
            {forceReinstallState && forceReinstallState.twins.length > 0 && (
              <p>
                Will assign forced: <b>{forceReinstallState.twins.map(({ twin }) => `${twin.name} (id ${twin.id}, version ${twin.version})`).join(', ')}</b>
              </p>
            )}
            {forceReinstallState && forceReinstallState.missing.length > 0 && (
              <>
                <p>
                  No byte-identical twin distribution set exists for <b>{forceReinstallState.missing.map(({ source }) => source.name).join(', ')}</b> yet.
                </p>
                <p>
                  On confirm, a new byte-identical twin will be created automatically by reusing the same software modules and distribution set type:{' '}
                  <b>{forceReinstallState.missing.map(({ proposed }) => `${proposed.name} (version ${proposed.version})`).join(', ')}</b>. Nothing is duplicated
                  silently: the created distribution set and its id are shown in the confirmation toast.
                </p>
              </>
            )}
            <p>
              <b>Warning:</b> this triggers a real update on {forceReinstallState?.targetLabel}.
            </p>
            <ActionButtons>
              <ActionButtons.Primary
                onClick={handleForceReinstall}
                disabled={isForceReinstalling || !forceReinstallState || (forceReinstallState.twins.length === 0 && forceReinstallState.missing.length === 0)}
              >
                {isForceReinstalling
                  ? 'Creating twin and forcing...'
                  : forceReinstallState && forceReinstallState.missing.length > 0
                    ? 'Create twin and force reinstall'
                    : 'Force reinstall'}
              </ActionButtons.Primary>
              <ActionButtons.Secondary onClick={() => setForceReinstallState(null)}>Cancel</ActionButtons.Secondary>
            </ActionButtons>
          </Modal.Content>
        </Modal>
      </div>
    </ExpandableCardProvider>
  );
}

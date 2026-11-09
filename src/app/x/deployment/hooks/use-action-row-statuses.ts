'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { TargetAction } from '@/entities/target-action';
import { TargetsService } from '@/services/targets-service';
import { getLatestActionStatus, isTerminalActionStatus } from '@/utils/action-progress';
import { ActionStatusOverrides, resolveActionStatus } from '@/utils/action-status-overrides';

export interface UseActionRowStatusesOptions {
  controllerId?: string;
  actions: TargetAction[];
  overrides: ActionStatusOverrides;
  onStatusUpdate: (actionId: number | string, status: string) => void;
  pollIntervalMs?: number;
  enabled?: boolean;
}

export interface UseActionRowStatusesResult {
  refreshActionStatus: (actionId: number | string) => Promise<string | undefined>;
}

const DEFAULT_ROW_STATUS_POLL_INTERVAL_MS = 4000;

/**
 * Keeps the status column of every non-terminal action row in sync with the
 * authoritative per-action status endpoint. The action list feed can lag
 * behind (e.g. `wait_for_confirmation` while the target reports `running`), so
 * the row status must not rely on the list alone. Rows are polled until the
 * live status becomes terminal; the caller merges the result into its
 * per-action overrides, which the table renders instead of the list value.
 */
export function useActionRowStatuses({
  controllerId,
  actions,
  overrides,
  onStatusUpdate,
  pollIntervalMs = DEFAULT_ROW_STATUS_POLL_INTERVAL_MS,
  enabled = true,
}: UseActionRowStatusesOptions): UseActionRowStatusesResult {
  const actionsRef = useRef(actions);
  const overridesRef = useRef(overrides);
  const onStatusUpdateRef = useRef(onStatusUpdate);
  const inFlightRef = useRef(new Set<string>());

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    overridesRef.current = overrides;
  }, [overrides]);

  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  const refreshActionStatus = useCallback(
    async (actionId: number | string, dedupe = false): Promise<string | undefined> => {
      if (!controllerId || actionId === undefined || actionId === null) {
        return undefined;
      }

      const key = String(actionId);
      if (dedupe) {
        if (inFlightRef.current.has(key)) {
          return undefined;
        }
        inFlightRef.current.add(key);
      }

      try {
        const logs = await TargetsService.getActionLog(controllerId, actionId);
        const latestStatus = getLatestActionStatus(logs);
        if (latestStatus) {
          onStatusUpdateRef.current(actionId, latestStatus);
        }
        return latestStatus;
      } catch {
        // A brand new action may not have status messages yet; keep showing the
        // list status instead of failing the whole poll cycle.
        return undefined;
      } finally {
        if (dedupe) {
          inFlightRef.current.delete(key);
        }
      }
    },
    [controllerId]
  );

  const actionsSignature = useMemo(() => actions.map((action) => `${action.id}:${resolveActionStatus(action, overrides)}`).join('|'), [actions, overrides]);

  const pollNonTerminalRows = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }
    const candidates = actionsRef.current.filter((action) => !isTerminalActionStatus(resolveActionStatus(action, overridesRef.current)));
    await Promise.allSettled(candidates.map((action) => refreshActionStatus(action.id, true)));
  }, [refreshActionStatus]);

  useEffect(() => {
    if (!enabled || !controllerId) {
      return;
    }

    void pollNonTerminalRows();
    const timer = window.setInterval(() => {
      void pollNonTerminalRows();
    }, pollIntervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void pollNonTerminalRows();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [controllerId, enabled, pollIntervalMs, pollNonTerminalRows]);

  // Refresh as soon as the list changes (initial load, target switch, or the
  // 5 s list poll), so a stale "waiting" row is corrected before the user can
  // click Confirm.
  useEffect(() => {
    if (!enabled || !controllerId) {
      return;
    }
    void pollNonTerminalRows();
  }, [actionsSignature, controllerId, enabled, pollNonTerminalRows]);

  return { refreshActionStatus };
}

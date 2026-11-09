'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionLog } from '@/entities/action-log';
import { TargetsService } from '@/services/targets-service';
import { isTerminalActionStatus, normalizeActionStatus } from '@/utils/action-progress';
import { isErrorWithMessage } from '@/utils/is-error-with-message';

export interface UseActionStatusOptions {
  controllerId?: string;
  actionId?: number | string;
  initialStatus?: string;
  enabled?: boolean;
  pollIntervalMs?: number;
  onStatusUpdate?: (actionId: number | string, status: string) => void;
}

export interface UseActionStatusResult {
  logs: ActionLog[];
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string;
  lastUpdated?: number;
  isLive: boolean;
  isTerminal: boolean;
  currentStatus?: string;
  refresh: () => void;
}

const DEFAULT_POLL_INTERVAL_MS = 4000;

const isNotFoundError = (error: unknown): boolean => {
  if (!isErrorWithMessage(error)) {
    return false;
  }
  const code = (error as { errorCode?: string; exceptionClass?: string }).errorCode ?? '';
  const exceptionClass = (error as { exceptionClass?: string }).exceptionClass ?? '';
  return /notFound|entityNotFound/i.test(code) || /notFound/i.test(exceptionClass) || /does not exist|not found|no status/i.test(error.message);
};

const sortLogs = (logs: ActionLog[]): ActionLog[] =>
  [...logs].sort((left, right) => {
    const leftTime = typeof left.reportedAt === 'number' ? left.reportedAt : typeof left.timestamp === 'number' ? left.timestamp : 0;
    const rightTime = typeof right.reportedAt === 'number' ? right.reportedAt : typeof right.timestamp === 'number' ? right.timestamp : 0;
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    return Number(left.id) - Number(right.id);
  });

/**
 * Polls the hawkBit action status endpoint while an action is expanded and not
 * terminal. Polling stops when the action settles, when the action is collapsed
 * (component unmount) or while the browser tab is hidden.
 */
export function useActionStatus({
  controllerId,
  actionId,
  initialStatus,
  enabled = true,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  onStatusUpdate,
}: UseActionStatusOptions): UseActionStatusResult {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const [lastUpdated, setLastUpdated] = useState<number>();
  const [notFound, setNotFound] = useState(false);
  const [derivedStatus, setDerivedStatus] = useState<string | undefined>(normalizeActionStatus(initialStatus));
  const [isVisible, setIsVisible] = useState(() => (typeof document === 'undefined' ? true : document.visibilityState === 'visible'));

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const onStatusUpdateRef = useRef(onStatusUpdate);

  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const handleVisibilityChange = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    hasLoadedRef.current = false;
    setLogs([]);
    setError(undefined);
    setLastUpdated(undefined);
    setNotFound(false);
    setDerivedStatus(normalizeActionStatus(initialStatus));
    // `initialStatus` is intentionally not a reset trigger: it comes from the
    // list poll and must not wipe already fetched status messages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionId, controllerId]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      setDerivedStatus(normalizeActionStatus(initialStatus));
    }
  }, [initialStatus]);

  const load = useCallback(
    async (background: boolean) => {
      if (!enabled || !controllerId || actionId === undefined || actionId === null) {
        return;
      }
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      if (background || hasLoadedRef.current) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const result = await TargetsService.getActionLog(controllerId, actionId);
        if (!mountedRef.current) {
          return;
        }
        const sortedLogs = sortLogs(result ?? []);
        setLogs(sortedLogs);
        setError(undefined);
        setNotFound(false);
        setLastUpdated(Date.now());
        hasLoadedRef.current = true;

        const latestStatus = normalizeActionStatus(sortedLogs[sortedLogs.length - 1]?.type);
        if (latestStatus) {
          setDerivedStatus(latestStatus);
          onStatusUpdateRef.current?.(actionId, latestStatus);
        }
      } catch (caught) {
        if (!mountedRef.current) {
          return;
        }
        if (isNotFoundError(caught)) {
          setNotFound(true);
          setLogs([]);
          setError('No status messages are available for this action yet.');
          setLastUpdated(Date.now());
          hasLoadedRef.current = true;
        } else {
          setError(isErrorWithMessage(caught) ? caught.message : 'Failed to load action status');
        }
      } finally {
        inFlightRef.current = false;
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [actionId, controllerId, enabled]
  );

  const effectiveStatus = derivedStatus ?? normalizeActionStatus(initialStatus);
  const isTerminal = isTerminalActionStatus(effectiveStatus);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void load(hasLoadedRef.current);

    if (isTerminal || notFound) {
      return;
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load(true);
      }
    }, pollIntervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void load(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isTerminal, notFound, load, pollIntervalMs]);

  const refresh = useCallback(() => {
    void load(hasLoadedRef.current);
  }, [load]);

  return {
    logs,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    isLive: enabled && !isTerminal && !notFound && isVisible,
    isTerminal,
    currentStatus: effectiveStatus,
    refresh,
  };
}

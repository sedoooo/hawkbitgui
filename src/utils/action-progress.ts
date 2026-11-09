import type { ActionLog } from '@/entities/action-log';

export type ActionTimelineState = 'completed' | 'current' | 'upcoming' | 'error' | 'canceled';

export interface ActionMessage {
  id: string;
  type: string;
  text: string;
  reportedAt: number;
}

export interface ActionTimelinePhase {
  key: string;
  label: string;
  state: ActionTimelineState;
  timestamp?: number;
  messages: string[];
}

export interface ActionProgressInfo {
  percent?: number;
  label?: string;
}

/**
 * hawkBit reports the coarse action status plus a stream of status messages. The
 * messages are grouped by the phase below; `running` covers download completion,
 * checksum, install percentages and the post-boot confirmation wait.
 */
export const ACTION_PHASE_ORDER = ['wait_for_confirmation', 'pending', 'retrieved', 'download', 'running', 'finished'] as const;

export type ActionPhaseKey = (typeof ACTION_PHASE_ORDER)[number];

export const ACTION_PHASE_LABELS: Record<string, string> = {
  wait_for_confirmation: 'Confirmation',
  pending: 'Pending',
  retrieved: 'Retrieved',
  download: 'Download',
  running: 'Installing',
  finished: 'Finished',
  error: 'Error',
  canceled: 'Canceled',
  canceling: 'Canceling',
};

export const TERMINAL_ACTION_STATUSES = ['finished', 'error', 'canceled'] as const;

const isCanonicalPhase = (value: string): value is ActionPhaseKey => (ACTION_PHASE_ORDER as readonly string[]).includes(value);

const isFailureStatus = (value?: string): boolean => value === 'error' || value === 'canceled' || value === 'canceling';

export function normalizeActionStatus(status?: string | null): string | undefined {
  const normalized = status?.trim().toLowerCase();
  return normalized ? normalized : undefined;
}

export function isTerminalActionStatus(status?: string | null): boolean {
  const normalized = normalizeActionStatus(status);
  return normalized !== undefined && (TERMINAL_ACTION_STATUSES as readonly string[]).includes(normalized);
}

/**
 * The action list feed can lag behind the per-action status endpoint (for
 * example it keeps reporting `wait_for_confirmation` while the target already
 * reports `running`). The newest status message is the authoritative live
 * status, so derive it from the status log stream.
 */
export function getLatestActionStatus(logs?: ActionLog[] | null): string | undefined {
  if (!logs || logs.length === 0) {
    return undefined;
  }
  const sorted = sortLogs(logs);
  return normalizeActionStatus(sorted[sorted.length - 1]?.type);
}

export function formatActionStatusLabel(status?: string | null): string {
  const normalized = normalizeActionStatus(status);
  if (!normalized) {
    return '';
  }
  return normalized === 'wait_for_confirmation' ? 'awaiting confirmation' : normalized.replace(/_/g, ' ');
}

const getLogTimestamp = (log: ActionLog): number => {
  if (typeof log.reportedAt === 'number') {
    return log.reportedAt;
  }
  if (typeof log.timestamp === 'number') {
    return log.timestamp;
  }
  return 0;
};

const getLogMessages = (log: ActionLog): string[] => {
  if (!Array.isArray(log.messages)) {
    return [];
  }
  return log.messages.map((message) => String(message));
};

const sortLogs = (logs: ActionLog[]): ActionLog[] =>
  [...logs].sort((left, right) => {
    const timestampDiff = getLogTimestamp(left) - getLogTimestamp(right);
    if (timestampDiff !== 0) {
      return timestampDiff;
    }
    return Number(left.id) - Number(right.id);
  });

export function flattenActionMessages(logs?: ActionLog[] | null): ActionMessage[] {
  if (!logs) {
    return [];
  }

  const messages: ActionMessage[] = [];

  sortLogs(logs).forEach((log, logIndex) => {
    const reportedAt = getLogTimestamp(log);
    getLogMessages(log).forEach((text, messageIndex) => {
      messages.push({
        id: `${log.id ?? logIndex}-${messageIndex}`,
        type: normalizeActionStatus(log.type) ?? 'unknown',
        text,
        reportedAt,
      });
    });
  });

  return messages;
}

const PERCENT_PATTERN = /(\d{1,3})\s*%/g;

export function extractActionProgress(messages: ActionMessage[]): ActionProgressInfo {
  let percent: number | undefined;

  messages.forEach((message) => {
    const matches = message.text.match(PERCENT_PATTERN);
    matches?.forEach((match) => {
      const value = Number.parseInt(match, 10);
      if (Number.isFinite(value) && value >= 0 && value <= 100) {
        percent = percent === undefined ? value : Math.max(percent, value);
      }
    });
  });

  return { percent, label: messages[messages.length - 1]?.text };
}

export interface BuildActionTimelineInput {
  status?: string | null;
  detailStatus?: string | null;
  logs?: ActionLog[] | null;
}

/**
 * Builds the ordered stepper for an action. Phases before the furthest reached
 * phase are marked completed, the furthest reached phase is current, and the
 * remaining phases are upcoming. Error/canceled actions receive a dedicated
 * terminal node so the failure is visible instead of being hidden in the text.
 */
export function buildActionTimeline({ status, detailStatus, logs }: BuildActionTimelineInput): ActionTimelinePhase[] {
  const sortedLogs = sortLogs(logs ?? []);
  const normalizedStatus = normalizeActionStatus(status);
  const normalizedDetail = normalizeActionStatus(detailStatus);
  const logTypes = sortedLogs.map((log) => normalizeActionStatus(log.type)).filter((type): type is string => type !== undefined);

  const hasFinishedLog = logTypes.includes('finished');
  const hasErrorLog = logTypes.includes('error');
  const hasCanceledLog = logTypes.includes('canceled');

  const reached = new Set<ActionPhaseKey>();
  logTypes.forEach((type) => {
    if (isCanonicalPhase(type)) {
      reached.add(type);
    }
  });

  const reachableStatus = isFailureStatus(normalizedStatus) ? undefined : normalizedStatus;
  const reachableDetail = isFailureStatus(normalizedDetail) ? undefined : normalizedDetail;
  if (reachableStatus && isCanonicalPhase(reachableStatus)) {
    reached.add(reachableStatus);
  }
  if (reachableDetail && isCanonicalPhase(reachableDetail)) {
    reached.add(reachableDetail);
  }

  const reachedIndexes = [...reached].map((key) => ACTION_PHASE_ORDER.indexOf(key));
  const maxReachedIndex = reachedIndexes.length > 0 ? Math.max(...reachedIndexes) : -1;
  const effectiveMaxIndex = hasFinishedLog ? ACTION_PHASE_ORDER.indexOf('finished') : maxReachedIndex;

  const terminalKey = hasCanceledLog || normalizedStatus === 'canceled' ? 'canceled' : hasErrorLog || normalizedStatus === 'error' ? 'error' : undefined;

  const phases: ActionTimelinePhase[] = ACTION_PHASE_ORDER.map((key, index) => {
    const phaseLogs = sortedLogs.filter((log) => normalizeActionStatus(log.type) === key);
    const isReached = index <= effectiveMaxIndex || phaseLogs.length > 0;

    let state: ActionTimelineState;
    if (!isReached) {
      state = 'upcoming';
    } else if (terminalKey) {
      state = 'completed';
    } else if (key === 'finished' && (normalizedStatus === 'finished' || hasFinishedLog)) {
      state = 'completed';
    } else if (index === effectiveMaxIndex) {
      state = 'current';
    } else {
      state = 'completed';
    }

    return {
      key,
      label: ACTION_PHASE_LABELS[key],
      state,
      timestamp: phaseLogs.length > 0 ? getLogTimestamp(phaseLogs[0]) : undefined,
      messages: phaseLogs.flatMap(getLogMessages),
    };
  });

  if (terminalKey) {
    const terminalLogs = sortedLogs.filter((log) => normalizeActionStatus(log.type) === terminalKey);
    phases.push({
      key: terminalKey,
      label: ACTION_PHASE_LABELS[terminalKey],
      state: terminalKey,
      timestamp: terminalLogs.length > 0 ? getLogTimestamp(terminalLogs[0]) : undefined,
      messages: terminalLogs.flatMap(getLogMessages),
    });
  }

  return phases;
}

export function getCurrentPhaseIndex(timeline: ActionTimelinePhase[]): number {
  const activeIndex = timeline.findIndex((phase) => phase.state === 'current' || phase.state === 'error' || phase.state === 'canceled');
  if (activeIndex >= 0) {
    return activeIndex;
  }

  for (let index = timeline.length - 1; index >= 0; index -= 1) {
    if (timeline[index].state === 'completed') {
      return index;
    }
  }

  return -1;
}

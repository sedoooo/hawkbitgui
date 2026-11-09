import { formatActionStatusLabel } from '@/utils/action-progress';

export const NOT_WAITING_CONFIRMATION_HTTP_STATUSES = [400, 404, 409] as const;

export function getHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const candidate = (error as { httpStatus?: unknown; status?: unknown }).httpStatus ?? (error as { status?: unknown }).status;
  return typeof candidate === 'number' ? candidate : undefined;
}

export function isNotWaitingConfirmationStatus(status?: number): boolean {
  return status !== undefined && (NOT_WAITING_CONFIRMATION_HTTP_STATUSES as readonly number[]).includes(status);
}

export interface ConfirmFailureDescriptionInput {
  httpStatus?: number;
  message?: string;
  currentStatus?: string;
}

/**
 * Turns the hawkBit response into an accurate user-facing message. hawkBit
 * answers a second confirmation with 400/404/409 and, for "not waiting for
 * confirmation", an empty body, so the HTTP status is the only reliable signal.
 */
export function describeConfirmFailure({ httpStatus, message, currentStatus }: ConfirmFailureDescriptionInput): string {
  const currentLabel = formatActionStatusLabel(currentStatus);
  const trimmedMessage = message?.trim() ?? '';
  // Axios synthesises "Request failed with status code 404" when the body is
  // empty; that is not a hawkBit message, so keep it out of the way of the
  // status-based explanation.
  const isGenericHttpMessage = /^request failed with status code \d+\.?$/i.test(trimmedMessage);
  const hasMessage = trimmedMessage !== '' && !isGenericHttpMessage;

  // Prefer hawkBit's own message (e.g. "Action does not exist") over a generic
  // status explanation. hawkBit's duplicate-confirmation response has an empty
  // body, so for that case the status/code is the only reliable signal.
  if (hasMessage) {
    const cleaned = trimmedMessage.replace(/\.+$/, '');
    return `Failed to confirm action: ${cleaned}.`;
  }

  if (isNotWaitingConfirmationStatus(httpStatus)) {
    if (currentLabel !== '' && currentStatus !== 'wait_for_confirmation') {
      return `Action is no longer waiting for confirmation (current status: ${currentLabel}).`;
    }
    return 'Action is no longer waiting for confirmation.';
  }

  return httpStatus ? `Failed to confirm action (HTTP ${httpStatus}).` : 'Failed to confirm action.';
}

export interface BulkConfirmSummary {
  succeeded: number;
  notWaiting: number;
  failed: number;
  firstFailureMessage?: string;
}

export function summarizeBulkConfirm(outcomes: { fulfilled: boolean; httpStatus?: number; currentStatus?: string; message?: string }[]): BulkConfirmSummary {
  let succeeded = 0;
  let notWaiting = 0;
  let failed = 0;
  let firstFailureMessage: string | undefined;

  outcomes.forEach((outcome) => {
    if (outcome.fulfilled) {
      succeeded += 1;
      return;
    }
    if (isNotWaitingConfirmationStatus(outcome.httpStatus) && outcome.currentStatus !== 'wait_for_confirmation') {
      notWaiting += 1;
      return;
    }
    failed += 1;
    firstFailureMessage ??= describeConfirmFailure(outcome);
  });

  return { succeeded, notWaiting, failed, firstFailureMessage };
}

export function formatBulkConfirmSummary(summary: BulkConfirmSummary): string {
  if (summary.failed === 0 && summary.notWaiting === 0) {
    return `Confirmed ${summary.succeeded} action(s)`;
  }

  const parts: string[] = [`Confirmed ${summary.succeeded} action(s)`];
  if (summary.notWaiting > 0) {
    parts.push(`${summary.notWaiting} already confirmed / no longer waiting`);
  }
  if (summary.failed > 0) {
    parts.push(`${summary.failed} failed${summary.firstFailureMessage ? `: ${summary.firstFailureMessage}` : ''}`);
  }
  return parts.join('; ');
}

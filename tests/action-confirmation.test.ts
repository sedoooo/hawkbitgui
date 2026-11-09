import { describe, expect, test } from 'bun:test';
import {
  describeConfirmFailure,
  formatBulkConfirmSummary,
  getHttpStatus,
  isNotWaitingConfirmationStatus,
  summarizeBulkConfirm,
} from '../src/utils/action-confirmation';

describe('getHttpStatus', () => {
  test('reads httpStatus or status from a rejected response', () => {
    expect(getHttpStatus({ httpStatus: 404 })).toBe(404);
    expect(getHttpStatus({ status: 409 })).toBe(409);
    expect(getHttpStatus({ message: 'boom' })).toBeUndefined();
    expect(getHttpStatus('nope')).toBeUndefined();
  });
});

describe('isNotWaitingConfirmationStatus', () => {
  test('treats 400/404/409 as "no longer waiting" candidates', () => {
    expect(isNotWaitingConfirmationStatus(400)).toBe(true);
    expect(isNotWaitingConfirmationStatus(404)).toBe(true);
    expect(isNotWaitingConfirmationStatus(409)).toBe(true);
    expect(isNotWaitingConfirmationStatus(500)).toBe(false);
    expect(isNotWaitingConfirmationStatus(undefined)).toBe(false);
  });
});

describe('describeConfirmFailure', () => {
  test('reports the real current status for a duplicate confirmation', () => {
    expect(describeConfirmFailure({ httpStatus: 404, currentStatus: 'running' })).toBe(
      'Action is no longer waiting for confirmation (current status: running).'
    );
    expect(describeConfirmFailure({ httpStatus: 409, currentStatus: 'finished' })).toBe(
      'Action is no longer waiting for confirmation (current status: finished).'
    );
  });

  test('humanises wait_for_confirmation and never calls it running', () => {
    expect(describeConfirmFailure({ httpStatus: 404, currentStatus: 'wait_for_confirmation' })).toBe('Action is no longer waiting for confirmation.');
  });

  test('uses the hawkBit message when the response has one', () => {
    expect(describeConfirmFailure({ httpStatus: 400, message: 'Action with given identifier {9} does not exist.' })).toBe(
      'Failed to confirm action: Action with given identifier {9} does not exist.'
    );
  });

  test('falls back to the HTTP status when the body is empty', () => {
    expect(describeConfirmFailure({ httpStatus: 500 })).toBe('Failed to confirm action (HTTP 500).');
    expect(describeConfirmFailure({})).toBe('Failed to confirm action.');
  });

  test('ignores the synthetic axios message for an empty error body', () => {
    expect(describeConfirmFailure({ httpStatus: 404, message: 'Request failed with status code 404', currentStatus: 'running' })).toBe(
      'Action is no longer waiting for confirmation (current status: running).'
    );
  });
});

describe('bulk confirmation summary', () => {
  test('counts stale/duplicate confirmations separately from real failures', () => {
    const summary = summarizeBulkConfirm([
      { fulfilled: true },
      { fulfilled: false, httpStatus: 404, currentStatus: 'running' },
      { fulfilled: false, httpStatus: 500, message: 'server error' },
    ]);

    expect(summary).toEqual({
      succeeded: 1,
      notWaiting: 1,
      failed: 1,
      firstFailureMessage: 'Failed to confirm action: server error.',
    });
    expect(formatBulkConfirmSummary(summary)).toContain('1 already confirmed / no longer waiting');
    expect(formatBulkConfirmSummary(summary)).toContain('1 failed');
  });

  test('reports a clean success', () => {
    const summary = summarizeBulkConfirm([{ fulfilled: true }, { fulfilled: true }]);
    expect(formatBulkConfirmSummary(summary)).toBe('Confirmed 2 action(s)');
  });
});

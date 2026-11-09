import { describe, expect, test } from 'bun:test';
import { isAutoConfirmAssignmentsEnabled } from '../src/utils/auto-confirm';

describe('isAutoConfirmAssignmentsEnabled', () => {
  test('is off by default so the manual Confirm stays authoritative', () => {
    expect(isAutoConfirmAssignmentsEnabled(undefined)).toBe(false);
    expect(isAutoConfirmAssignmentsEnabled('')).toBe(false);
    expect(isAutoConfirmAssignmentsEnabled('false')).toBe(false);
  });

  test('can be opted in explicitly', () => {
    expect(isAutoConfirmAssignmentsEnabled('true')).toBe(true);
    expect(isAutoConfirmAssignmentsEnabled(' TRUE ')).toBe(true);
    expect(isAutoConfirmAssignmentsEnabled('1')).toBe(true);
  });
});

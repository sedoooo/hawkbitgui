import { describe, expect, test } from 'bun:test';
import {
  isLiveWaitingForConfirmation,
  pruneActionStatusOverrides,
  removeActionStatusOverride,
  resolveActionStatus,
  setActionStatusOverride,
} from '../src/utils/action-status-overrides';

describe('action status overrides', () => {
  test('keeps live statuses per action id', () => {
    let overrides = setActionStatusOverride({}, 195, 'running');
    overrides = setActionStatusOverride(overrides, 193, 'finished');

    expect(overrides).toEqual({
      '195': { status: 'running', detailStatus: 'running' },
      '193': { status: 'finished', detailStatus: 'finished' },
    });
  });

  test('updating one action never touches another action', () => {
    const initial = { '193': { status: 'finished', detailStatus: 'finished' } };
    const updated = setActionStatusOverride(initial, 195, 'running');

    expect(updated['193']).toEqual({ status: 'finished', detailStatus: 'finished' });
    expect(updated['195']).toEqual({ status: 'running', detailStatus: 'running' });
  });

  test('removing an override only removes the requested action', () => {
    const initial = {
      '193': { status: 'finished', detailStatus: 'finished' },
      '195': { status: 'running', detailStatus: 'running' },
    };
    const updated = removeActionStatusOverride(initial, 195);

    expect(updated).toEqual({ '193': { status: 'finished', detailStatus: 'finished' } });
    expect(removeActionStatusOverride(initial, 999)).toBe(initial);
  });

  test('returns the same object when the status did not change', () => {
    const initial = setActionStatusOverride({}, 12, 'running');
    expect(setActionStatusOverride(initial, 12, 'running')).toBe(initial);
  });

  test('prunes overrides for actions that disappeared from the list', () => {
    const initial = {
      '12': { status: 'running', detailStatus: 'running' },
      '91': { status: 'finished', detailStatus: 'finished' },
      '404': { status: 'wait_for_confirmation', detailStatus: 'wait_for_confirmation' },
    };
    const pruned = pruneActionStatusOverrides(initial, [
      { id: 12, status: 'running' },
      { id: 91, status: 'finished' },
    ]);

    expect(pruned).toEqual({
      '12': { status: 'running', detailStatus: 'running' },
      '91': { status: 'finished', detailStatus: 'finished' },
    });
  });

  test('keeps a live status even when the stale list already reports a terminal status', () => {
    const initial = { '91': { status: 'running', detailStatus: 'running' } };
    const pruned = pruneActionStatusOverrides(initial, [{ id: 91, status: 'finished' }]);

    expect(pruned).toEqual({ '91': { status: 'running', detailStatus: 'running' } });
  });

  test('returns the original object when nothing needs pruning', () => {
    const initial = { '12': { status: 'running', detailStatus: 'running' } };
    expect(pruneActionStatusOverrides(initial, [{ id: 12, status: 'running' }])).toBe(initial);
  });
});

describe('resolveActionStatus', () => {
  test('prefers a live override over the stale list status', () => {
    const action = { id: 204, status: 'wait_for_confirmation', detailStatus: 'wait_for_confirmation' };
    expect(resolveActionStatus(action, { '204': { status: 'running', detailStatus: 'running' } })).toBe('running');
  });

  test('falls back to the list status when no live status is known', () => {
    expect(resolveActionStatus({ id: 204, status: 'retrieved', detailStatus: 'retrieved' }, {})).toBe('retrieved');
    expect(resolveActionStatus({ id: 204, status: 'retrieved' }, {})).toBe('retrieved');
  });

  test('returns an empty string when the action has no status at all', () => {
    expect(resolveActionStatus({ id: 204 }, {})).toBe('');
  });
});

describe('isLiveWaitingForConfirmation', () => {
  test('trusts only a live wait_for_confirmation status, not the stale list value', () => {
    const staleListAction = { id: 204, status: 'wait_for_confirmation' };
    expect(isLiveWaitingForConfirmation(staleListAction, {})).toBe(false);
    expect(isLiveWaitingForConfirmation(staleListAction, { '204': { status: 'running', detailStatus: 'running' } })).toBe(false);
    expect(isLiveWaitingForConfirmation(staleListAction, { '204': { status: 'wait_for_confirmation', detailStatus: 'wait_for_confirmation' } })).toBe(true);
  });
});

import { describe, expect, test } from 'bun:test';
import { pruneActionStatusOverrides, removeActionStatusOverride, setActionStatusOverride } from '../src/utils/action-status-overrides';

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

  test('prunes overrides for missing and terminal actions only', () => {
    const initial = {
      '12': { status: 'running', detailStatus: 'running' },
      '91': { status: 'finished', detailStatus: 'finished' },
      '404': { status: 'wait_for_confirmation', detailStatus: 'wait_for_confirmation' },
    };
    const pruned = pruneActionStatusOverrides(initial, [
      { id: 12, status: 'running' },
      { id: 91, status: 'finished' },
    ]);

    expect(pruned).toEqual({ '12': { status: 'running', detailStatus: 'running' } });
  });

  test('returns the original object when nothing needs pruning', () => {
    const initial = { '12': { status: 'running', detailStatus: 'running' } };
    expect(pruneActionStatusOverrides(initial, [{ id: 12, status: 'running' }])).toBe(initial);
  });
});

export type ActionStatusOverride = {
  status?: string;
  detailStatus?: string;
};

export type ActionStatusOverrides = Record<string, ActionStatusOverride>;

type ActionStatusSnapshot = {
  id: number | string;
  status?: string | null;
  detailStatus?: string | null;
};

const TERMINAL_STATUSES = new Set(['finished', 'error', 'canceled', 'canceling']);

export function setActionStatusOverride(overrides: ActionStatusOverrides, actionId: number | string, status: string): ActionStatusOverrides {
  return {
    ...overrides,
    [String(actionId)]: { status, detailStatus: status },
  };
}

export function removeActionStatusOverride(overrides: ActionStatusOverrides, actionId: number | string): ActionStatusOverrides {
  const key = String(actionId);
  if (!(key in overrides)) {
    return overrides;
  }
  const next = { ...overrides };
  delete next[key];
  return next;
}

/**
 * Keeps live overrides strictly per-action: an override is dropped once its
 * action is gone from the list or hawkBit has already reported a terminal
 * state, so a stale live status can never outlive the action it belongs to.
 */
export function pruneActionStatusOverrides(overrides: ActionStatusOverrides, actions: ActionStatusSnapshot[]): ActionStatusOverrides {
  const activeIds = new Set(
    actions.filter((action) => !TERMINAL_STATUSES.has(String(action.detailStatus ?? action.status ?? '').toLowerCase())).map((action) => String(action.id))
  );

  const entries = Object.entries(overrides).filter(([actionId]) => activeIds.has(actionId));
  if (entries.length === Object.keys(overrides).length) {
    return overrides;
  }
  return Object.fromEntries(entries);
}

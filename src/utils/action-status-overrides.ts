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

export function setActionStatusOverride(overrides: ActionStatusOverrides, actionId: number | string, status: string): ActionStatusOverrides {
  const key = String(actionId);
  const current = overrides[key];
  if (current?.status === status && current.detailStatus === status) {
    return overrides;
  }
  return {
    ...overrides,
    [key]: { status, detailStatus: status },
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
 * Resolves the status a row must display. A live status fetched from the
 * per-action status endpoint always wins over the (potentially stale) list
 * status, because hawkBit's action list can keep reporting
 * `wait_for_confirmation` while the status endpoint already says `running`.
 */
export function resolveActionStatus(action: ActionStatusSnapshot, overrides: ActionStatusOverrides): string {
  const override = overrides[String(action.id)];
  return override?.detailStatus ?? override?.status ?? action.detailStatus ?? action.status ?? '';
}

/**
 * True only when the per-action status endpoint has positively confirmed that
 * the action is waiting for confirmation. The list value is deliberately not
 * trusted here: it can still say `wait_for_confirmation` while the action is
 * already running, which would offer a Confirm button that cannot succeed.
 */
export function isLiveWaitingForConfirmation(action: ActionStatusSnapshot, overrides: ActionStatusOverrides): boolean {
  const override = overrides[String(action.id)];
  return (override?.detailStatus ?? override?.status) === 'wait_for_confirmation';
}

/**
 * Keeps live overrides for actions that still exist in the list. Terminal list
 * statuses are not a reason to drop an override: the list itself can be stale,
 * so a terminal status from the live endpoint must stay visible until the
 * action disappears (target switch / action removal).
 */
export function pruneActionStatusOverrides(overrides: ActionStatusOverrides, actions: ActionStatusSnapshot[]): ActionStatusOverrides {
  const activeIds = new Set(actions.map((action) => String(action.id)));

  const entries = Object.entries(overrides).filter(([actionId]) => activeIds.has(actionId));
  if (entries.length === Object.keys(overrides).length) {
    return overrides;
  }
  return Object.fromEntries(entries);
}

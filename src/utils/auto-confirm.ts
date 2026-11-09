export const AUTO_CONFIRM_ASSIGNMENTS_ENV_VAR = 'NEXT_PUBLIC_HAWKBITGUI_AUTO_CONFIRM';

/**
 * The GUI keeps manual confirmation as the default flow. Auto-confirming an
 * assignment races the manual Confirm button (the action is confirmed before
 * the user can click it), so it must be opted into explicitly at build time.
 */
export function isAutoConfirmAssignmentsEnabled(value: string | undefined = process.env.NEXT_PUBLIC_HAWKBITGUI_AUTO_CONFIRM): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}

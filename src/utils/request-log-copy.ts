import type { RequestLogEntry } from '@/stores/request-log-store';
import { redactSensitiveText } from '@/utils/redact';
import { formatUtcDateTime } from '@/utils/table-display';

/**
 * Builds the text copied by the "Last request" window. Every value comes from
 * the already-redacted request log entry and is passed through the redactor one
 * more time before being written to the clipboard.
 */
export function buildRequestCopyText(entry: RequestLogEntry | null | undefined): string {
  if (!entry) {
    return '';
  }

  const lines = [
    `${entry.method} ${entry.url}`,
    `Status: ${entry.status ?? 'pending'}${entry.statusText ? ` ${entry.statusText}` : ''}`,
    `Duration: ${entry.durationMs ?? '—'} ms`,
    `Started: ${formatUtcDateTime(entry.startedAt)}`,
  ];

  const result = entry.errorMessage ?? entry.summary;

  if (result) {
    lines.push(`Result: ${result}`);
  }

  return redactSensitiveText(lines.join('\n'));
}

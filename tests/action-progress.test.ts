import { describe, expect, test } from 'bun:test';
import type { ActionLog } from '../src/entities/action-log';
import {
  ACTION_PHASE_ORDER,
  buildActionTimeline,
  extractActionProgress,
  flattenActionMessages,
  formatActionStatusLabel,
  getCurrentPhaseIndex,
  isTerminalActionStatus,
} from '../src/utils/action-progress';

const log = (id: number, type: string, reportedAt: number, messages: string[]): ActionLog => ({ id, type, reportedAt, messages });

const runningLogs: ActionLog[] = [
  log(1, 'wait_for_confirmation', 1000, ['Assignment initiated by user admin']),
  log(2, 'retrieved', 2000, ['Target retrieved update action and should start now the download.']),
  log(3, 'download', 3000, ['Target downloads /DEFAULT/controller/v1/target/softwaremodules/1/artifacts/bundle.raucb']),
  log(4, 'running', 4000, ['Download complete. 20.05 MB/s', 'File checksum OK.']),
  log(5, 'running', 5000, [' 40% Copying image to rootfs.1']),
  log(6, 'running', 6000, [' 72% Copying image to rootfs.1']),
];

describe('isTerminalActionStatus', () => {
  test('recognises finished, error and canceled', () => {
    expect(isTerminalActionStatus('finished')).toBe(true);
    expect(isTerminalActionStatus('ERROR')).toBe(true);
    expect(isTerminalActionStatus('canceled')).toBe(true);
  });

  test('keeps polling for in-flight statuses', () => {
    expect(isTerminalActionStatus('wait_for_confirmation')).toBe(false);
    expect(isTerminalActionStatus('pending')).toBe(false);
    expect(isTerminalActionStatus('running')).toBe(false);
    expect(isTerminalActionStatus('canceling')).toBe(false);
    expect(isTerminalActionStatus(undefined)).toBe(false);
  });
});

describe('formatActionStatusLabel', () => {
  test('humanises the confirmation status', () => {
    expect(formatActionStatusLabel('wait_for_confirmation')).toBe('awaiting confirmation');
    expect(formatActionStatusLabel('FINISHED')).toBe('finished');
    expect(formatActionStatusLabel(undefined)).toBe('');
  });
});

describe('flattenActionMessages', () => {
  test('flattens grouped messages in chronological order with unique ids', () => {
    const messages = flattenActionMessages(runningLogs);

    expect(messages.map((message) => message.text)).toEqual([
      'Assignment initiated by user admin',
      'Target retrieved update action and should start now the download.',
      'Target downloads /DEFAULT/controller/v1/target/softwaremodules/1/artifacts/bundle.raucb',
      'Download complete. 20.05 MB/s',
      'File checksum OK.',
      ' 40% Copying image to rootfs.1',
      ' 72% Copying image to rootfs.1',
    ]);
    expect(new Set(messages.map((message) => message.id)).size).toBe(messages.length);
    expect(messages.every((message) => typeof message.reportedAt === 'number')).toBe(true);
  });

  test('tolerates missing logs or messages', () => {
    expect(flattenActionMessages(undefined)).toEqual([]);
    expect(flattenActionMessages([{ id: 1, type: 'running', reportedAt: 10 } as ActionLog])).toEqual([]);
  });
});

describe('extractActionProgress', () => {
  test('uses the highest percentage found in the messages', () => {
    expect(extractActionProgress(flattenActionMessages(runningLogs)).percent).toBe(72);
  });

  test('returns the latest message as the label', () => {
    expect(extractActionProgress(flattenActionMessages(runningLogs)).label).toBe(' 72% Copying image to rootfs.1');
  });

  test('returns no percentage when the messages do not carry one', () => {
    const progress = extractActionProgress(flattenActionMessages([log(1, 'pending', 1000, ['Waiting'])]));
    expect(progress.percent).toBeUndefined();
    expect(progress.label).toBe('Waiting');
  });

  test('ignores out-of-range percentages', () => {
    expect(extractActionProgress([{ id: '1-0', type: 'running', text: '999% done', reportedAt: 1 }]).percent).toBeUndefined();
  });
});

describe('buildActionTimeline', () => {
  test('marks the current running phase and the previous phases completed', () => {
    const timeline = buildActionTimeline({ status: 'running', logs: runningLogs });

    expect(timeline.map((phase) => phase.key)).toEqual([...ACTION_PHASE_ORDER]);
    expect(timeline.find((phase) => phase.key === 'running')?.state).toBe('current');
    expect(timeline.find((phase) => phase.key === 'download')?.state).toBe('completed');
    expect(timeline.find((phase) => phase.key === 'finished')?.state).toBe('upcoming');
    expect(getCurrentPhaseIndex(timeline)).toBe(4);
  });

  test('shows the waiting confirmation phase from the action status alone', () => {
    const timeline = buildActionTimeline({ status: 'wait_for_confirmation' });

    expect(timeline[0].state).toBe('current');
    expect(timeline.slice(1).every((phase) => phase.state === 'upcoming')).toBe(true);
  });

  test('adds a completed finished phase for a terminal success', () => {
    const logs = [...runningLogs, log(7, 'finished', 7000, ['Software bundle installed successfully after post-boot confirmation.'])];
    const timeline = buildActionTimeline({ status: 'finished', logs });

    expect(timeline.every((phase) => phase.state === 'completed')).toBe(true);
    expect(timeline[timeline.length - 1].key).toBe('finished');
    expect(getCurrentPhaseIndex(timeline)).toBe(ACTION_PHASE_ORDER.length - 1);
  });

  test('appends an error node and does not claim the action finished', () => {
    const logs = [...runningLogs, log(7, 'error', 7000, ['Failed to install software bundle.'])];
    const timeline = buildActionTimeline({ status: 'error', logs });

    expect(timeline[timeline.length - 1]).toMatchObject({ key: 'error', state: 'error' });
    expect(timeline.find((phase) => phase.key === 'finished')?.state).toBe('upcoming');
    expect(timeline.find((phase) => phase.key === 'running')?.state).toBe('completed');
  });

  test('appends a canceled node for canceled actions', () => {
    const timeline = buildActionTimeline({ status: 'canceled', logs: [runningLogs[0], log(2, 'canceled', 2000, ['Action canceled by user.'])] });

    expect(timeline[timeline.length - 1]).toMatchObject({ key: 'canceled', state: 'canceled' });
    expect(timeline[0].state).toBe('completed');
  });

  test('handles an empty status endpoint without inventing phases', () => {
    const timeline = buildActionTimeline({ status: 'pending', logs: [] });

    expect(timeline.map((phase) => phase.key)).toEqual([...ACTION_PHASE_ORDER]);
    expect(timeline.find((phase) => phase.key === 'pending')?.state).toBe('current');
  });

  test('deduplicates messages inside a phase', () => {
    const timeline = buildActionTimeline({ status: 'running', logs: runningLogs });
    expect(timeline.find((phase) => phase.key === 'running')?.messages).toEqual([
      'Download complete. 20.05 MB/s',
      'File checksum OK.',
      ' 40% Copying image to rootfs.1',
      ' 72% Copying image to rootfs.1',
    ]);
  });
});

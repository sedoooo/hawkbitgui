import { describe, expect, test } from 'bun:test';
import {
  clampRequestWindowSize,
  DEFAULT_REQUEST_WINDOW_SIZE,
  parseRequestWindowSize,
  REQUEST_WINDOW_MAX_HEIGHT,
  REQUEST_WINDOW_MAX_WIDTH,
  REQUEST_WINDOW_MIN_HEIGHT,
  REQUEST_WINDOW_MIN_WIDTH,
  resizeRequestWindowSize,
  serializeRequestWindowSize,
} from '../src/utils/request-window-size';
import { buildRequestCopyText } from '../src/utils/request-log-copy';

describe('request window size persistence', () => {
  test('falls back to defaults for missing or corrupt storage values', () => {
    expect(parseRequestWindowSize(null)).toEqual(DEFAULT_REQUEST_WINDOW_SIZE);
    expect(parseRequestWindowSize('not-json')).toEqual(DEFAULT_REQUEST_WINDOW_SIZE);
  });

  test('clamps persisted sizes into the sensible min/max range', () => {
    expect(clampRequestWindowSize({ width: 10, height: 10 })).toEqual({ width: REQUEST_WINDOW_MIN_WIDTH, height: REQUEST_WINDOW_MIN_HEIGHT });
    expect(clampRequestWindowSize({ width: 9999, height: 9999 })).toEqual({ width: REQUEST_WINDOW_MAX_WIDTH, height: REQUEST_WINDOW_MAX_HEIGHT });
  });

  test('round-trips a resize through local storage serialization', () => {
    const resized = resizeRequestWindowSize({ width: 200, height: 300 }, 40, 50);
    expect(parseRequestWindowSize(serializeRequestWindowSize(resized))).toEqual({ width: 240, height: 350 });
  });
});

describe('buildRequestCopyText', () => {
  test('formats the current request result', () => {
    const text = buildRequestCopyText({
      id: 1,
      method: 'GET',
      url: '/targets?limit=10',
      startedAt: Date.UTC(2026, 10, 9, 1, 0, 0),
      state: 'success',
      status: 200,
      statusText: 'OK',
      durationMs: 12,
      summary: '200 OK',
    });

    expect(text).toContain('GET /targets?limit=10');
    expect(text).toContain('Status: 200 OK');
    expect(text).toContain('Duration: 12 ms');
    expect(text).toContain('Result: 200 OK');
  });

  test('never copies secrets even if a raw value reached the log', () => {
    const text = buildRequestCopyText({
      id: 2,
      method: 'GET',
      url: '/targets?token=super-secret-value',
      startedAt: Date.now(),
      state: 'error',
      status: 401,
      statusText: 'Unauthorized',
      durationMs: 3,
      errorMessage: 'Authorization: Basic dXNlcjpwYXNz',
    });

    expect(text).not.toContain('super-secret-value');
    expect(text).not.toContain('dXNlcjpwYXNz');
    expect(text).toContain('[REDACTED]');
  });

  test('returns an empty string when there is no current request', () => {
    expect(buildRequestCopyText(null)).toBe('');
  });
});

import { describe, expect, test } from 'bun:test';
import { redactSensitiveText, summarizeHttpStatus } from '../src/utils/redact';

describe('redactSensitiveText', () => {
  test('redacts Basic and Bearer authorization values', () => {
    expect(redactSensitiveText('Authorization: Basic dXNlcjpwYXNz')).not.toContain('dXNlcjpwYXNz');
    expect(redactSensitiveText('Bearer abc.def.ghi')).toBe('Bearer [REDACTED]');
  });

  test('redacts sensitive query parameters', () => {
    const redacted = redactSensitiveText('/api/hawkbit/targets?token=abc123&name=demo&securityToken=secret');

    expect(redacted).toContain('token=[REDACTED]');
    expect(redacted).toContain('securityToken=[REDACTED]');
    expect(redacted).toContain('name=demo');
    expect(redacted).not.toContain('abc123');
    expect(redacted).not.toContain('secret');
  });

  test('redacts key/value secrets in summaries', () => {
    const redacted = redactSensitiveText('request failed password=hunter2 and api_key=xyz');

    expect(redacted).not.toContain('hunter2');
    expect(redacted).not.toContain('xyz');
    expect(redacted).toContain('[REDACTED]');
  });

  test('redacts JSON-style secrets', () => {
    const redacted = redactSensitiveText('{"authorization":"Basic abc","password":"topsecret"}');

    expect(redacted).not.toContain('Basic abc');
    expect(redacted).not.toContain('topsecret');
  });
});

describe('summarizeHttpStatus', () => {
  test('formats status and status text', () => {
    expect(summarizeHttpStatus(200, 'OK')).toBe('200 OK');
    expect(summarizeHttpStatus(404, '')).toBe('404');
    expect(summarizeHttpStatus(undefined)).toBe('No response');
  });
});

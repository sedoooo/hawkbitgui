import { describe, expect, test } from 'bun:test';
import {
  EMPTY_DISPLAY_VALUE,
  formatUtcDateTime,
  resolveDistributionSetType,
  resolveSoftwareModuleType,
  resolveSoftwareModuleVendor,
  resolveTargetId,
} from '../src/utils/table-display';

describe('formatUtcDateTime', () => {
  test('formats epoch milliseconds as a human-readable UTC timestamp', () => {
    expect(formatUtcDateTime(1793991818932)).toBe('2026-11-06 19:03:38 UTC');
  });

  test('formats ISO strings as UTC', () => {
    expect(formatUtcDateTime('2026-11-06T19:03:38.932Z')).toBe('2026-11-06 19:03:38 UTC');
  });

  test('returns a placeholder for empty or invalid values', () => {
    expect(formatUtcDateTime(null)).toBe(EMPTY_DISPLAY_VALUE);
    expect(formatUtcDateTime(undefined)).toBe(EMPTY_DISPLAY_VALUE);
    expect(formatUtcDateTime('')).toBe(EMPTY_DISPLAY_VALUE);
    expect(formatUtcDateTime('not-a-date')).toBe(EMPTY_DISPLAY_VALUE);
  });
});

describe('software module display mapping', () => {
  test('uses the hawkBit typeName for the Type column', () => {
    expect(resolveSoftwareModuleType({ type: 'os', typeName: 'OS' })).toBe('OS');
    expect(resolveSoftwareModuleType({ type: 'dongle-fw', typeName: 'Dongle firmware' })).toBe('Dongle firmware');
    expect(resolveSoftwareModuleType({ type: 'node-fw', typeName: 'Node firmware' })).toBe('Node firmware');
  });

  test('falls back to the type key when typeName is missing', () => {
    expect(resolveSoftwareModuleType({ type: 'os' })).toBe('os');
  });

  test('uses the hawkBit vendor field and marks missing vendors', () => {
    expect(resolveSoftwareModuleVendor({ vendor: 'fota-demo' })).toBe('fota-demo');
    expect(resolveSoftwareModuleVendor({ vendor: 'fota-demo-dk2' })).toBe('fota-demo-dk2');
    expect(resolveSoftwareModuleVendor({ vendor: null })).toBe(EMPTY_DISPLAY_VALUE);
  });
});

describe('distribution set display mapping', () => {
  test('uses the hawkBit typeName for the Type column', () => {
    expect(resolveDistributionSetType({ type: 'os', typeName: 'OS only' })).toBe('OS only');
    expect(resolveDistributionSetType({ type: 'app' })).toBe('app');
    expect(resolveDistributionSetType({})).toBe(EMPTY_DISPLAY_VALUE);
  });
});

describe('target display mapping', () => {
  test('maps the Target Id column to the hawkBit controllerId', () => {
    expect(resolveTargetId({ controllerId: 'fota-dk2-01' })).toBe('fota-dk2-01');
    expect(resolveTargetId({ controllerId: 'fota-dk2-01-dongle' })).toBe('fota-dk2-01-dongle');
    expect(resolveTargetId({ controllerId: 'fota-dk2-01~esp32s3-983DAEEB1BCC' })).toBe('fota-dk2-01~esp32s3-983DAEEB1BCC');
  });

  test('marks targets without a controllerId', () => {
    expect(resolveTargetId({ controllerId: null })).toBe(EMPTY_DISPLAY_VALUE);
    expect(resolveTargetId({})).toBe(EMPTY_DISPLAY_VALUE);
  });
});

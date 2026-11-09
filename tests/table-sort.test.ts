import { describe, expect, test } from 'bun:test';
import { compareSemver, compareValues, getSortDirection, toggleSortingState } from '../src/utils/table-sort';

describe('compareSemver', () => {
  test('orders numeric version segments numerically', () => {
    expect(compareSemver('6.1.9', '6.1.13')).toBeLessThan(0);
    expect(compareSemver('6.1.13', '6.1.9')).toBeGreaterThan(0);
    expect(compareSemver('10.0.0', '9.9.9')).toBeGreaterThan(0);
  });

  test('treats a release as newer than its pre-releases', () => {
    expect(compareSemver('1.0.0-alpha', '1.0.0-alpha.1')).toBeLessThan(0);
    expect(compareSemver('1.0.0-alpha.1', '1.0.0-beta')).toBeLessThan(0);
    expect(compareSemver('1.0.0-beta', '1.0.0')).toBeLessThan(0);
    expect(compareSemver('2.0.0-rc.1', '2.0.0')).toBeLessThan(0);
    expect(compareSemver('6.1.13-SNAPSHOT', '6.1.13')).toBeLessThan(0);
  });

  test('compares numeric pre-release identifiers numerically', () => {
    expect(compareSemver('1.0.0-2', '1.0.0-10')).toBeLessThan(0);
  });

  test('treats equivalent forms as equal and ignores build metadata', () => {
    expect(compareSemver('1.2.3', 'v1.2.3')).toBe(0);
    expect(compareSemver('1.2.3+build.1', '1.2.3+build.2')).toBe(0);
    expect(compareSemver('1.2', '1.2.0')).toBe(0);
  });

  test('falls back to natural string ordering for non-semver values', () => {
    expect(compareSemver('release-a', 'release-b')).toBeLessThan(0);
    expect(compareSemver('build2', 'build10')).toBeLessThan(0);
  });
});

describe('compareValues', () => {
  test('uses the semver comparator for version columns', () => {
    expect(compareValues('6.1.9', '6.1.13', 'version')).toBeLessThan(0);
    expect(compareValues('6.1.13', '6.1.9', 'version')).toBeGreaterThan(0);
  });

  test('compares numbers numerically and dates chronologically', () => {
    expect(compareValues(9, 13, 'size')).toBeLessThan(0);
    expect(compareValues('2026-01-02T00:00:00Z', '2026-01-10T00:00:00Z', 'createdAt')).toBeLessThan(0);
  });

  test('compares plain strings naturally', () => {
    expect(compareValues('target-2', 'target-10', 'name')).toBeLessThan(0);
    expect(compareValues('beta', 'alpha', 'name')).toBeGreaterThan(0);
  });

  test('orders target controller ids naturally for the Target Id column', () => {
    expect(compareValues('fota-dk2-01', 'fota-dk2-01-dongle', 'controllerId')).toBeLessThan(0);
    expect(compareValues('fota-dk2-01-dongle', 'fota-sim-01', 'controllerId')).toBeLessThan(0);
    expect(compareValues('target-2', 'target-10', 'controllerId')).toBeLessThan(0);
  });

  test('keeps empty values after defined values in ascending order', () => {
    expect(compareValues(null, 'value', 'name')).toBeGreaterThan(0);
    expect(compareValues('value', undefined, 'name')).toBeLessThan(0);
    expect(compareValues(null, undefined, 'name')).toBe(0);
  });
});

describe('toggleSortingState', () => {
  test('cycles ascending, descending, then unsorted', () => {
    const ascending = toggleSortingState([], 'version');
    expect(ascending).toEqual([{ id: 'version', desc: false }]);
    expect(getSortDirection(ascending, 'version')).toBe('asc');

    const descending = toggleSortingState(ascending, 'version');
    expect(descending).toEqual([{ id: 'version', desc: true }]);
    expect(getSortDirection(descending, 'version')).toBe('desc');

    const unsorted = toggleSortingState(descending, 'version');
    expect(unsorted).toEqual([]);
    expect(getSortDirection(unsorted, 'version')).toBeNull();
  });

  test('switching columns starts the new column ascending', () => {
    const state = toggleSortingState([{ id: 'version', desc: true }], 'name');
    expect(state).toEqual([{ id: 'name', desc: false }]);
  });
});

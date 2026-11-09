import { describe, expect, test } from 'bun:test';
import {
  enableAllColumnsVisibility,
  getColumnVisibilityStorageKey,
  mergeColumnVisibility,
  serializeColumnVisibility,
  transformToColumnVisibility,
} from '../src/utils/columns-visibility';

const defaults = {
  controllerId: { id: 'controllerId', label: 'Target Id (Controller ID)', isSelected: true },
  name: { id: 'name', label: 'Name', isSelected: true },
  createdBy: { id: 'createdBy', label: 'Created By', isSelected: false },
  actions: { id: 'actions', label: 'Actions', isSelected: true },
};

describe('mergeColumnVisibility', () => {
  test('returns the defaults when nothing is persisted', () => {
    expect(mergeColumnVisibility(defaults, null)).toEqual(defaults);
    expect(mergeColumnVisibility(defaults, undefined)).toEqual(defaults);
  });

  test('applies persisted visibility flags by column id', () => {
    const merged = mergeColumnVisibility(defaults, { controllerId: false, createdBy: true });

    expect(merged.controllerId.isSelected).toBe(false);
    expect(merged.createdBy.isSelected).toBe(true);
    expect(merged.name.isSelected).toBe(true);
    expect(merged.actions.isSelected).toBe(true);
  });

  test('ignores unknown columns and non-boolean persisted values', () => {
    const merged = mergeColumnVisibility(defaults, { unknown: false, name: 'hidden', createdBy: null });

    expect(merged.unknown).toBeUndefined();
    expect(merged.name.isSelected).toBe(true);
    expect(merged.createdBy.isSelected).toBe(false);
  });

  test('keeps defaults for columns added after the selection was stored', () => {
    const merged = mergeColumnVisibility(defaults, { name: false });

    expect(merged.controllerId.isSelected).toBe(true);
    expect(merged.actions.isSelected).toBe(true);
  });
});

describe('serializeColumnVisibility', () => {
  test('stores only the selected flags', () => {
    const serialized = JSON.parse(serializeColumnVisibility(defaults));

    expect(serialized).toEqual({
      controllerId: true,
      name: true,
      createdBy: false,
      actions: true,
    });
    expect(serialized).toEqual(transformToColumnVisibility(defaults));
  });

  test('round-trips through mergeColumnVisibility', () => {
    const selection = { ...defaults, createdBy: { ...defaults.createdBy, isSelected: true } };
    const restored = mergeColumnVisibility(defaults, JSON.parse(serializeColumnVisibility(selection)));

    expect(restored.createdBy.isSelected).toBe(true);
  });
});

describe('column visibility helpers', () => {
  test('enableAllColumnsVisibility selects every column', () => {
    const selected = enableAllColumnsVisibility(defaults);

    expect(Object.values(selected).every((column) => column.isSelected)).toBe(true);
    expect(defaults.createdBy.isSelected).toBe(false);
  });

  test('builds a stable per-table storage key', () => {
    expect(getColumnVisibilityStorageKey('deployment-targets-table')).toBe('hawkbitgui.visible-columns.deployment-targets-table');
  });
});

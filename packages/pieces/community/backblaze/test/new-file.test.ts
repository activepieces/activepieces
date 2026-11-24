import { describe, expect, it } from 'vitest';
import '../src/index';
import { newFileTriggerInternals } from '../src/lib/triggers/new-file';

function object({ key, ms }: { key: string; ms: number }) {
  return { Key: key, LastModified: new Date(ms), ETag: '"e"', Size: 1, StorageClass: 'STANDARD' };
}

describe('selectNewObjects', () => {
  it('emits newer objects regardless of key order', () => {
    const { items, nextState } = newFileTriggerInternals.selectNewObjects({
      objects: [object({ key: 'a', ms: 3000 }), object({ key: 'z', ms: 1000 }), object({ key: 'm', ms: 2000 })],
      state: { lastModifiedMs: 1000, seenKeys: ['z'] },
    });
    expect(items.map((item) => item.Key)).toEqual(['m', 'a']);
    expect(nextState).toEqual({ lastModifiedMs: 3000, seenKeys: ['a'] });
  });
  it('emits a late object sharing the boundary timestamp once', () => {
    const first = newFileTriggerInternals.selectNewObjects({
      objects: [object({ key: 'a', ms: 5000 })],
      state: { lastModifiedMs: 1000, seenKeys: [] },
    });
    const second = newFileTriggerInternals.selectNewObjects({
      objects: [object({ key: 'a', ms: 5000 }), object({ key: 'b', ms: 5000 })],
      state: first.nextState,
    });
    const third = newFileTriggerInternals.selectNewObjects({
      objects: [object({ key: 'a', ms: 5000 }), object({ key: 'b', ms: 5000 })],
      state: second.nextState,
    });
    expect(second.items.map((item) => item.Key)).toEqual(['b']);
    expect(third.items).toEqual([]);
  });
  it('emits nothing when nothing changed', () => {
    const { items } = newFileTriggerInternals.selectNewObjects({
      objects: [object({ key: 'a', ms: 1000 })],
      state: { lastModifiedMs: 2000, seenKeys: [] },
    });
    expect(items).toEqual([]);
  });
});

describe('normalizePrefix', () => {
  it('adds a trailing slash so siblings do not match', () => {
    expect(newFileTriggerInternals.normalizePrefix('docs')).toBe('docs/');
    expect(newFileTriggerInternals.normalizePrefix('')).toBeUndefined();
  });
});

describe('seedFromLegacy', () => {
  it('resumes from the legacy lastItem key without re-firing older files', () => {
    const objects = [object({ key: 'old', ms: 1000 }), object({ key: 'last', ms: 2000 }), object({ key: 'gap', ms: 3000 })];
    const state = newFileTriggerInternals.seedFromLegacy({ legacyItem: 'last', objects });
    expect(state).toEqual({ lastModifiedMs: 2000, seenKeys: ['last'] });
    if (!state) {
      return;
    }
    const { items } = newFileTriggerInternals.selectNewObjects({ objects, state });
    expect(items.map((item) => item.Key)).toEqual(['gap']);
  });
  it('seeds from a legacy object carrying LastModified', () => {
    const state = newFileTriggerInternals.seedFromLegacy({
      legacyItem: { Key: 'last', LastModified: '1970-01-01T00:00:02.000Z' },
      objects: [],
    });
    expect(state).toEqual({ lastModifiedMs: 2000, seenKeys: ['last'] });
  });
  it('returns null when the legacy key is gone', () => {
    expect(newFileTriggerInternals.seedFromLegacy({ legacyItem: 'missing', objects: [] })).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import { stableNameUtils } from '@/app/routes/chat-with-ai/lib/use-stable-resource-name';

describe('stableNameUtils.resolve', () => {
  it('returns the live name and caches it per resource identity', () => {
    const cache = new Map<string, string>();
    const name = stableNameUtils.resolve({
      cache,
      type: 'table',
      id: 't1',
      liveName: 'Leads',
    });
    expect(name).toBe('Leads');
    expect(cache.get('table:t1')).toBe('Leads');
  });

  it('falls back to the last-known name when the live name is briefly missing', () => {
    const cache = new Map<string, string>();
    stableNameUtils.resolve({
      cache,
      type: 'table',
      id: 't1',
      liveName: 'Leads',
    });
    // Simulates the post-navigation refetch gap where the query is reloading.
    const name = stableNameUtils.resolve({
      cache,
      type: 'table',
      id: 't1',
      liveName: undefined,
    });
    expect(name).toBe('Leads');
  });

  it('never downgrades to a blank/whitespace live name', () => {
    const cache = new Map<string, string>();
    stableNameUtils.resolve({
      cache,
      type: 'flow',
      id: 'f1',
      liveName: 'Sync',
    });
    const name = stableNameUtils.resolve({
      cache,
      type: 'flow',
      id: 'f1',
      liveName: '   ',
    });
    expect(name).toBe('Sync');
  });

  it('falls back to a humanized type label on a true first load', () => {
    const cache = new Map<string, string>();
    const name = stableNameUtils.resolve({
      cache,
      type: 'table',
      id: 'never-seen',
      liveName: undefined,
    });
    expect(name).toBe(stableNameUtils.humanizeType('table'));
    expect(name).not.toBe('table');
  });

  it('keeps separate names per resource id', () => {
    const cache = new Map<string, string>();
    stableNameUtils.resolve({
      cache,
      type: 'flow',
      id: 'a',
      liveName: 'Alpha',
    });
    stableNameUtils.resolve({ cache, type: 'flow', id: 'b', liveName: 'Beta' });
    expect(stableNameUtils.resolve({ cache, type: 'flow', id: 'a' })).toBe(
      'Alpha',
    );
    expect(stableNameUtils.resolve({ cache, type: 'flow', id: 'b' })).toBe(
      'Beta',
    );
  });
});

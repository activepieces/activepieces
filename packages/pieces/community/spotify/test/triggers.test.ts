import { afterEach, describe, expect, test, vi } from 'vitest';
import playlistItemsChanged from '../src/lib/triggers/playlist-items-changed';
import newSavedTrack from '../src/lib/triggers/new-saved-track';
import newPlaylistItem from '../src/lib/triggers/new-playlist-item';
import newRecentlyPlayedTrack from '../src/lib/triggers/new-recently-played-track';
import triggers from '../src/lib/triggers';
import { SpotifyApiError } from '../src/lib/common/errors';

const AUTH = { access_token: 'TKN', data: {}, props: {} };
const PL = '3cEYpjA9oz9GiPac4AsH4n';

function uri(n: number): string {
  return `spotify:track:${String(n).padStart(22, 'B')}`;
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    store: {
      get: async (key: string) => (data.has(key) ? structuredClone(data.get(key)) : null),
      put: async (key: string, value: unknown) => {
        data.set(key, structuredClone(value));
        return value;
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

function stubFetch(respond: (url: URL) => FakeResponse): URL[] {
  const seen: URL[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      seen.push(url);
      const r = respond(url);
      return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'content-type': 'application/json' } });
    })
  );
  return seen;
}

function hook({ trigger, name, ctx }: { trigger: unknown; name: 'onEnable' | 'run' | 'test' | 'onDisable'; ctx: Record<string, unknown> }): Promise<unknown> {
  const fn: unknown = Reflect.get(Object(trigger), name);
  if (typeof fn !== 'function') {
    throw new Error(`trigger has no ${name}`);
  }
  return Reflect.apply(fn, trigger, [{ auth: AUTH, propsValue: {}, ...ctx }]);
}

function saved({ n, addedAt }: { n: number; addedAt: string }) {
  return { added_at: addedAt, track: { id: `t${n}`, name: `Track ${n}`, uri: uri(n) } };
}

function playlistEntry({ n, addedAt }: { n: number | null; addedAt: string | null }) {
  return { added_at: addedAt, is_local: false, item: n === null ? null : { id: `t${n}`, name: `T${n}`, uri: uri(n) } };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('trigger metadata', () => {
  test('every trigger is READ with aiMetadata, sampleData and an outputSchema', () => {
    expect(triggers.map((t) => t.name)).toEqual(['playlist_items_changed', 'new_saved_track', 'new_playlist_item', 'new_recently_played_track']);
    for (const t of triggers) {
      expect(t.classification).toBe('READ');
      expect(t.aiMetadata?.description).toBeTruthy();
      expect(t.outputSchema).toBeDefined();
      expect(Object.keys(Object(t.sampleData)).length).toBeGreaterThan(0);
    }
  });
});

describe('playlist_items_changed (P1: null track crash, /items)', () => {
  test('a null item does not crash, hash uses uri, change fires once', async () => {
    const { store } = memoryStore();
    let items: unknown[] = [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' }), playlistEntry({ n: null, addedAt: '2026-01-02T00:00:00Z' })];
    const seen = stubFetch(() => ({ status: 200, body: { items, next: null } }));
    const ctx = { store, propsValue: { playlist_id: PL } };
    await hook({ trigger: playlistItemsChanged, name: 'onEnable', ctx });
    expect(seen[0].pathname).toBe(`/v1/playlists/${PL}`);
    expect(seen[1].pathname).toBe(`/v1/playlists/${PL}/items`);
    expect(await hook({ trigger: playlistItemsChanged, name: 'run', ctx })).toEqual([]);
    items = [...items, playlistEntry({ n: 2, addedAt: '2026-01-03T00:00:00Z' })];
    const fired = await hook({ trigger: playlistItemsChanged, name: 'run', ctx });
    expect(fired).toHaveLength(1);
    expect(fired).toMatchObject([{ total: 3 }]);
    expect(await hook({ trigger: playlistItemsChanged, name: 'run', ctx })).toEqual([]);
  });

  test('two local files with id null but different added_at still change the hash', async () => {
    const { store } = memoryStore();
    const local = (addedAt: string) => ({ added_at: addedAt, is_local: true, item: { id: null, name: 'L', uri: `spotify:local:a:b:${addedAt}:1` } });
    let items: unknown[] = [local('1')];
    stubFetch(() => ({ status: 200, body: { items, next: null } }));
    const ctx = { store, propsValue: { playlist_id: PL } };
    await hook({ trigger: playlistItemsChanged, name: 'onEnable', ctx });
    items = [local('2')];
    expect(await hook({ trigger: playlistItemsChanged, name: 'run', ctx })).toHaveLength(1);
  });

  test('without a stored hash the first poll only stores the baseline', async () => {
    const { store, data } = memoryStore();
    stubFetch(() => ({ status: 200, body: { items: [playlistEntry({ n: 1, addedAt: 'x' })], next: null } }));
    expect(await hook({ trigger: playlistItemsChanged, name: 'run', ctx: { store, propsValue: { playlist_id: PL } } })).toEqual([]);
    expect(data.size).toBe(1);
  });
});

describe('new_saved_track', () => {
  test('first poll stores the checkpoint only, later polls emit each new track once', async () => {
    const { store, data } = memoryStore();
    let items = [saved({ n: 2, addedAt: '2026-01-02T00:00:00Z' }), saved({ n: 1, addedAt: '2026-01-01T00:00:00Z' })];
    stubFetch(() => ({ status: 200, body: { items, next: null } }));
    expect(await hook({ trigger: newSavedTrack, name: 'run', ctx: { store } })).toEqual([]);
    expect(data.get('new_saved_track_checkpoint')).toEqual({ ms: Date.parse('2026-01-02T00:00:00Z'), keys: [uri(2)] });
    expect(await hook({ trigger: newSavedTrack, name: 'run', ctx: { store } })).toEqual([]);
    items = [saved({ n: 4, addedAt: '2026-01-03T00:00:00Z' }), saved({ n: 3, addedAt: '2026-01-03T00:00:00Z' }), ...items];
    const fired = await hook({ trigger: newSavedTrack, name: 'run', ctx: { store } });
    expect(fired).toHaveLength(2);
    expect(await hook({ trigger: newSavedTrack, name: 'run', ctx: { store } })).toEqual([]);
  });

  test('a track saved in the same second as the checkpoint still fires once', async () => {
    const { store } = memoryStore();
    let items = [saved({ n: 1, addedAt: '2026-01-01T00:00:00Z' })];
    stubFetch(() => ({ status: 200, body: { items, next: null } }));
    await hook({ trigger: newSavedTrack, name: 'onEnable', ctx: { store } });
    items = [saved({ n: 2, addedAt: '2026-01-01T00:00:00Z' }), ...items];
    expect(await hook({ trigger: newSavedTrack, name: 'run', ctx: { store } })).toEqual([saved({ n: 2, addedAt: '2026-01-01T00:00:00Z' })]);
    expect(await hook({ trigger: newSavedTrack, name: 'run', ctx: { store } })).toEqual([]);
  });

  test('pages back with offset until it reaches tracks older than the checkpoint', async () => {
    const { store } = memoryStore();
    await store.put('new_saved_track_checkpoint', { ms: Date.parse('2026-01-01T00:00:00Z'), keys: [uri(0)] });
    const seen = stubFetch((url) => {
      const offset = Number(url.searchParams.get('offset'));
      return offset === 0
        ? { status: 200, body: { items: Array.from({ length: 50 }, (_, i) => saved({ n: 100 + i, addedAt: '2026-02-01T00:00:00Z' })), next: 'n' } }
        : { status: 200, body: { items: [saved({ n: 1, addedAt: '2026-01-05T00:00:00Z' }), saved({ n: 0, addedAt: '2025-12-31T00:00:00Z' })], next: 'n' } };
    });
    const fired = await hook({ trigger: newSavedTrack, name: 'run', ctx: { store } });
    expect(seen.map((u) => u.searchParams.get('offset'))).toEqual(['0', '50']);
    expect(fired).toHaveLength(51);
  });

  test('throws without moving the checkpoint when more saves arrived than the page budget covers', async () => {
    const { store, data } = memoryStore();
    const checkpoint = { ms: Date.parse('2026-01-01T00:00:00Z'), keys: [uri(0)] };
    await store.put('new_saved_track_checkpoint', checkpoint);
    const seen = stubFetch((url) => {
      const offset = Number(url.searchParams.get('offset'));
      return { status: 200, body: { items: Array.from({ length: 50 }, (_, i) => saved({ n: 1000 + offset + i, addedAt: '2026-02-01T00:00:00Z' })), next: 'n' } };
    });
    await expect(hook({ trigger: newSavedTrack, name: 'run', ctx: { store } })).rejects.toThrow(/More than 500 tracks were saved/);
    expect(seen).toHaveLength(10);
    expect(data.get('new_saved_track_checkpoint')).toEqual(checkpoint);
  });

  test('the baseline reads every track tied at the newest timestamp, so none of them fire later', async () => {
    const { store } = memoryStore();
    const tied = Array.from({ length: 70 }, (_, i) => saved({ n: 200 + i, addedAt: '2026-03-01T00:00:00Z' }));
    const all = [...tied, saved({ n: 1, addedAt: '2026-01-01T00:00:00Z' })];
    stubFetch((url) => {
      const offset = Number(url.searchParams.get('offset'));
      const items = all.slice(offset, offset + 50);
      return { status: 200, body: { items, next: offset + 50 < all.length ? 'n' : null } };
    });
    await hook({ trigger: newSavedTrack, name: 'onEnable', ctx: { store } });
    expect(await hook({ trigger: newSavedTrack, name: 'run', ctx: { store } })).toEqual([]);
  });

  test('a 403 is rethrown, never swallowed into an empty poll', async () => {
    const { store } = memoryStore();
    await store.put('new_saved_track_checkpoint', { ms: 1, keys: [] });
    stubFetch(() => ({ status: 403, body: { error: { status: 403, message: 'Insufficient client scope' } } }));
    await expect(hook({ trigger: newSavedTrack, name: 'run', ctx: { store } })).rejects.toBeInstanceOf(SpotifyApiError);
  });

  test('onEnable keeps the stored checkpoint on republish', async () => {
    const { store, data } = memoryStore();
    await store.put('new_saved_track_checkpoint', { ms: 5, keys: ['k'] });
    const seen = stubFetch(() => ({ status: 200, body: { items: [], next: null } }));
    await hook({ trigger: newSavedTrack, name: 'onEnable', ctx: { store, isRepublish: true } });
    expect(seen).toHaveLength(0);
    expect(data.get('new_saved_track_checkpoint')).toEqual({ ms: 5, keys: ['k'] });
  });
});

describe('new_playlist_item', () => {
  test('emits only items with added_at after the stored max, including a same-second batch', async () => {
    const { store } = memoryStore();
    let items: unknown[] = [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' }), playlistEntry({ n: 2, addedAt: '2026-01-02T00:00:00Z' })];
    stubFetch(() => ({ status: 200, body: { items, next: null } }));
    const ctx = { store, propsValue: { playlist_id: PL } };
    await hook({ trigger: newPlaylistItem, name: 'onEnable', ctx });
    expect(await hook({ trigger: newPlaylistItem, name: 'run', ctx })).toEqual([]);
    items = [...items, playlistEntry({ n: 3, addedAt: '2026-01-03T00:00:00Z' }), playlistEntry({ n: 4, addedAt: '2026-01-03T00:00:00Z' }), playlistEntry({ n: null, addedAt: null })];
    const fired = await hook({ trigger: newPlaylistItem, name: 'run', ctx });
    expect(fired).toMatchObject([
      { playlist_id: PL, item: { uri: uri(3) }, track: { uri: uri(3) } },
      { playlist_id: PL, item: { uri: uri(4) } },
    ]);
    expect(await hook({ trigger: newPlaylistItem, name: 'run', ctx })).toEqual([]);
  });

  test('a changed playlist re-baselines instead of emitting the whole playlist', async () => {
    const { store } = memoryStore();
    stubFetch(() => ({ status: 200, body: { items: [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' })], next: null } }));
    await hook({ trigger: newPlaylistItem, name: 'onEnable', ctx: { store, propsValue: { playlist_id: PL } } });
    expect(await hook({ trigger: newPlaylistItem, name: 'run', ctx: { store, propsValue: { playlist_id: '37i9dQZF1DXcBWIGoYBM5M' } } })).toEqual([]);
  });
});

describe('new_playlist_item: playlist edited during a paged read', () => {
  const A = playlistEntry({ n: 100, addedAt: '2026-02-01T00:00:00Z' });
  const B = playlistEntry({ n: 101, addedAt: '2026-02-02T00:00:00Z' });

  function editingApi({ edits }: { edits: number }) {
    const state = {
      snapshot: 1,
      editsLeft: edits,
      items: Array.from({ length: 50 }, (_, i) => playlistEntry({ n: i, addedAt: '2026-01-01T00:00:00Z' })),
    };
    const seen = stubFetch((url) => {
      if (url.pathname === `/v1/playlists/${PL}`) {
        return { status: 200, body: { snapshot_id: `snap-${state.snapshot}` } };
      }
      const offset = Number(url.searchParams.get('offset'));
      const limit = Number(url.searchParams.get('limit'));
      const items = state.items.slice(offset, offset + limit);
      const body = { items, total: state.items.length, next: offset + limit < state.items.length ? 'https://api.spotify.com/v1/next' : null };
      if (offset === 0 && limit === 50 && state.editsLeft > 0) {
        state.editsLeft -= 1;
        state.items = state.items.filter((_, index) => index !== 10);
        state.snapshot += 1;
      }
      return { status: 200, body };
    });
    return { state, seen };
  }

  test('an edit that shifts an addition into a read page re-reads and fires both additions once', async () => {
    const { store, data } = memoryStore();
    const { state } = editingApi({ edits: 0 });
    const ctx = { store, propsValue: { playlist_id: PL } };
    await hook({ trigger: newPlaylistItem, name: 'onEnable', ctx });
    state.items = [...state.items, A, B];
    state.snapshot += 1;
    state.editsLeft = 1;
    const fired = await hook({ trigger: newPlaylistItem, name: 'run', ctx });
    expect(fired).toMatchObject([{ item: { uri: uri(100) } }, { item: { uri: uri(101) } }]);
    expect(data.get('new_playlist_item_checkpoint')).toMatchObject({ snapshotId: `snap-${state.snapshot}` });
    expect(await hook({ trigger: newPlaylistItem, name: 'run', ctx })).toEqual([]);
  });

  test('a playlist that keeps changing saves nothing and the next poll fires each addition once', async () => {
    const { store, data } = memoryStore();
    const { state } = editingApi({ edits: 0 });
    const ctx = { store, propsValue: { playlist_id: PL } };
    await hook({ trigger: newPlaylistItem, name: 'onEnable', ctx });
    const enabled = structuredClone(data.get('new_playlist_item_checkpoint'));
    state.items = [...state.items, A, B];
    state.snapshot += 1;
    state.editsLeft = 2;
    expect(await hook({ trigger: newPlaylistItem, name: 'run', ctx })).toEqual([]);
    expect(data.get('new_playlist_item_checkpoint')).toEqual(enabled);
    const fired = await hook({ trigger: newPlaylistItem, name: 'run', ctx });
    expect(fired).toMatchObject([{ item: { uri: uri(100) } }, { item: { uri: uri(101) } }]);
    expect(await hook({ trigger: newPlaylistItem, name: 'run', ctx })).toEqual([]);
  });
});

describe('playlist size limits', () => {
  test('playlist_items_changed throws instead of returning [] when the page budget runs out', async () => {
    const { store } = memoryStore();
    await store.put('playlist_changed_trigger_hash_v2', { playlistId: PL, hash: 'old' });
    const seen = stubFetch(() => ({ status: 200, body: { items: [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' })], next: 'https://api.spotify.com/v1/next', total: 1_000_000 } }));
    const ctx = { store, propsValue: { playlist_id: PL } };
    await expect(hook({ trigger: playlistItemsChanged, name: 'run', ctx })).rejects.toThrow(/more than 10,000 items/);
    expect(seen).toHaveLength(201);
    await expect(hook({ trigger: playlistItemsChanged, name: 'onEnable', ctx })).rejects.toThrow(/more than 10,000 items/);
  });

  test('playlist_items_changed re-baselines when a republish changes the playlist', async () => {
    const { store } = memoryStore();
    await store.put('playlist_changed_trigger_hash_v2', { playlistId: PL, hash: 'old' });
    stubFetch(() => ({ status: 200, body: { items: [playlistEntry({ n: 1, addedAt: 'x' })], next: null } }));
    const ctx = { store, propsValue: { playlist_id: '37i9dQZF1DXcBWIGoYBM5M' } };
    await hook({ trigger: playlistItemsChanged, name: 'onEnable', ctx: { ...ctx, isRepublish: true } });
    expect(await hook({ trigger: playlistItemsChanged, name: 'run', ctx })).toEqual([]);
  });

  test('new_playlist_item reads the tail of a playlist over 10,000 items and emits the appended item', async () => {
    const { store } = memoryStore();
    let total = 20_000;
    const seen = stubFetch((url) => {
      const offset = Number(url.searchParams.get('offset'));
      const limit = Number(url.searchParams.get('limit'));
      const end = Math.min(offset + limit, total);
      const items = Array.from({ length: Math.max(0, end - offset) }, (_, i) => {
        const index = offset + i;
        return playlistEntry({ n: index, addedAt: index >= 20_000 ? '2026-03-01T00:00:00Z' : '2026-01-01T00:00:00Z' });
      });
      return { status: 200, body: { items, total, next: end < total ? 'https://api.spotify.com/v1/next' : null } };
    });
    const ctx = { store, propsValue: { playlist_id: PL } };
    await hook({ trigger: newPlaylistItem, name: 'onEnable', ctx });
    expect(seen[2].searchParams.get('offset')).toBe('10000');
    total = 20_001;
    const fired = await hook({ trigger: newPlaylistItem, name: 'run', ctx });
    expect(fired).toMatchObject([{ playlist_id: PL, item: { uri: uri(20_000) } }]);
    expect(await hook({ trigger: newPlaylistItem, name: 'run', ctx })).toEqual([]);
  });
});

describe('new_recently_played_track', () => {
  test('first poll stores the checkpoint, the after cursor advances, no duplicates', async () => {
    const { store, data } = memoryStore();
    let items = [{ played_at: '2026-01-01T00:00:00.500Z', track: { uri: uri(1) }, context: null }];
    const seen = stubFetch(() => ({ status: 200, body: { items, next: null, cursors: null } }));
    expect(await hook({ trigger: newRecentlyPlayedTrack, name: 'run', ctx: { store } })).toEqual([]);
    const first = Date.parse('2026-01-01T00:00:00.500Z');
    expect(data.get('new_recently_played_track_checkpoint')).toEqual({ ms: first, keys: [`2026-01-01T00:00:00.500Z|${uri(1)}`] });
    expect(seen[0].searchParams.get('after')).toBeNull();
    items = [{ played_at: '2026-01-01T00:05:00.000Z', track: { uri: uri(2) }, context: null }, ...items];
    const fired = await hook({ trigger: newRecentlyPlayedTrack, name: 'run', ctx: { store } });
    expect(seen[1].searchParams.get('after')).toBe(String(first - 1));
    expect(fired).toMatchObject([{ track: { uri: uri(2) } }]);
    expect(await hook({ trigger: newRecentlyPlayedTrack, name: 'run', ctx: { store } })).toEqual([]);
    expect(seen[2].searchParams.get('after')).toBe(String(Date.parse('2026-01-01T00:05:00.000Z') - 1));
  });
});

describe('new_recently_played_track paging', () => {
  const base = Date.parse('2026-01-01T00:00:00.000Z');
  function play(n: number) {
    return { played_at: new Date(base + n * 1000).toISOString(), track: { uri: uri(n) }, context: null };
  }

  test('reads every page of plays since the checkpoint before saving it', async () => {
    const { store, data } = memoryStore();
    data.set('new_recently_played_track_checkpoint', { ms: base, keys: [`${new Date(base).toISOString()}|${uri(0)}`] });
    const seen = stubFetch((url) => {
      const after = Number(url.searchParams.get('after'));
      if (after < base + 50 * 1000) {
        const items = Array.from({ length: 50 }, (_, i) => play(50 - i));
        return { status: 200, body: { items, next: 'more', cursors: { after: String(base + 50 * 1000), before: null } } };
      }
      return { status: 200, body: { items: [play(53), play(52), play(51)], next: null, cursors: { after: String(base + 53 * 1000), before: null } } };
    });
    const fired = await hook({ trigger: newRecentlyPlayedTrack, name: 'run', ctx: { store } });
    expect(seen).toHaveLength(2);
    expect(seen[1].searchParams.get('after')).toBe(String(base + 50 * 1000));
    expect(fired).toHaveLength(53);
    expect(data.get('new_recently_played_track_checkpoint')).toMatchObject({ ms: base + 53 * 1000 });
  });

  test('fails without moving the checkpoint when the page limit is reached', async () => {
    const { store, data } = memoryStore();
    const checkpoint = { ms: base, keys: ['k'] };
    data.set('new_recently_played_track_checkpoint', checkpoint);
    const seen = stubFetch((url) => {
      const after = Number(url.searchParams.get('after'));
      const start = after + 1;
      const items = Array.from({ length: 50 }, (_, i) => ({ played_at: new Date(start + (49 - i) * 1000).toISOString(), track: { uri: uri(i) }, context: null }));
      return { status: 200, body: { items, next: 'more', cursors: { after: String(start + 49 * 1000), before: null } } };
    });
    const error = await hook({ trigger: newRecentlyPlayedTrack, name: 'run', ctx: { store } }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain('Turn the trigger off and on');
    expect(seen).toHaveLength(10);
    expect(data.get('new_recently_played_track_checkpoint')).toEqual(checkpoint);
  });
});

describe('qa trigger edge cases', () => {
  test('recently played: an empty response with null cursors keeps the checkpoint', async () => {
    const { store, data } = memoryStore();
    const checkpoint = { ms: Date.parse('2026-01-01T00:00:00.500Z'), keys: ['k'] };
    data.set('new_recently_played_track_checkpoint', checkpoint);
    const seen = stubFetch(() => ({ status: 200, body: { items: [], next: null, cursors: null } }));
    expect(await hook({ trigger: newRecentlyPlayedTrack, name: 'run', ctx: { store } })).toEqual([]);
    expect(seen[0].searchParams.get('after')).toBe(String(checkpoint.ms - 1));
    expect(data.get('new_recently_played_track_checkpoint')).toEqual(checkpoint);
  });

  test('recently played: replaying the same track later fires again', async () => {
    const { store, data } = memoryStore();
    const first = '2026-01-01T00:00:00.500Z';
    data.set('new_recently_played_track_checkpoint', { ms: Date.parse(first), keys: [`${first}|${uri(1)}`] });
    stubFetch(() => ({ status: 200, body: { items: [
      { played_at: '2026-01-01T00:04:00.000Z', track: { uri: uri(1) }, context: null },
      { played_at: first, track: { uri: uri(1) }, context: null },
    ], next: null, cursors: null } }));
    const fired = await hook({ trigger: newRecentlyPlayedTrack, name: 'run', ctx: { store } });
    expect(fired).toHaveLength(1);
    expect(fired).toMatchObject([{ played_at: '2026-01-01T00:04:00.000Z' }]);
  });

  test('playlist_items_changed rethrows a 403 instead of returning no change', async () => {
    const { store, data } = memoryStore();
    data.set('playlist_changed_trigger_hash_v2', 'abc');
    stubFetch(() => ({ status: 403, body: { error: { status: 403, message: 'Forbidden' } } }));
    const error = await hook({ trigger: playlistItemsChanged, name: 'run', ctx: { store, propsValue: { playlist_id: PL } } }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SpotifyApiError);
    expect(error).toMatchObject({ status: 403 });
    expect(data.get('playlist_changed_trigger_hash_v2')).toBe('abc');
  });

  test('new_playlist_item: re-adding a track already in the playlist fires for the new entry', async () => {
    const { store } = memoryStore();
    let items: unknown[] = [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' })];
    stubFetch(() => ({ status: 200, body: { items, next: null } }));
    const ctx = { store, propsValue: { playlist_id: PL } };
    await hook({ trigger: newPlaylistItem, name: 'onEnable', ctx });
    items = [...items, playlistEntry({ n: 1, addedAt: '2026-01-02T00:00:00Z' })];
    const fired = await hook({ trigger: newPlaylistItem, name: 'run', ctx });
    expect(fired).toMatchObject([{ playlist_id: PL, added_at: '2026-01-02T00:00:00Z' }]);
  });

  test('new_playlist_item: a second copy added in the checkpoint second still fires', async () => {
    const { store } = memoryStore();
    let items: unknown[] = [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' })];
    stubFetch(() => ({ status: 200, body: { items, next: null } }));
    const ctx = { store, propsValue: { playlist_id: PL } };
    await hook({ trigger: newPlaylistItem, name: 'onEnable', ctx });
    items = [...items, playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' })];
    expect(await hook({ trigger: newPlaylistItem, name: 'run', ctx })).toHaveLength(1);
    expect(await hook({ trigger: newPlaylistItem, name: 'run', ctx })).toEqual([]);
  });
});

describe('republish keeps the checkpoint (self-hosted order: onDisable without a flag, then onEnable with isRepublish)', () => {
  const recent = (n: number, at: string) => ({ played_at: at, track: { uri: uri(n) }, context: null });
  const cases = [
    {
      name: 'new_saved_track',
      trigger: newSavedTrack,
      key: 'new_saved_track_checkpoint',
      propsValue: {},
      before: () => [saved({ n: 1, addedAt: '2026-01-01T00:00:00Z' })],
      after: () => [saved({ n: 2, addedAt: '2026-01-02T00:00:00Z' }), saved({ n: 1, addedAt: '2026-01-01T00:00:00Z' })],
      body: (items: unknown[]) => ({ items, next: null }),
    },
    {
      name: 'new_recently_played_track',
      trigger: newRecentlyPlayedTrack,
      key: 'new_recently_played_track_checkpoint',
      propsValue: {},
      before: () => [recent(1, '2026-01-01T00:00:00.000Z')],
      after: () => [recent(2, '2026-01-02T00:00:00.000Z'), recent(1, '2026-01-01T00:00:00.000Z')],
      body: (items: unknown[]) => ({ items, next: null, cursors: null }),
    },
    {
      name: 'new_playlist_item',
      trigger: newPlaylistItem,
      key: 'new_playlist_item_checkpoint',
      propsValue: { playlist_id: PL },
      before: () => [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' })],
      after: () => [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' }), playlistEntry({ n: 2, addedAt: '2026-01-02T00:00:00Z' })],
      body: (items: unknown[]) => ({ items, next: null, total: items.length }),
    },
    {
      name: 'playlist_items_changed',
      trigger: playlistItemsChanged,
      key: 'playlist_changed_trigger_hash_v2',
      propsValue: { playlist_id: PL },
      before: () => [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' })],
      after: () => [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' }), playlistEntry({ n: 2, addedAt: '2026-01-02T00:00:00Z' })],
      body: (items: unknown[]) => ({ items, next: null, total: items.length }),
    },
  ];

  for (const c of cases) {
    test(`${c.name}: an item added before the republish still fires after it`, async () => {
      const { store, data } = memoryStore();
      let items: unknown[] = c.before();
      stubFetch(() => ({ status: 200, body: c.body(items) }));
      const ctx = { store, propsValue: c.propsValue };
      await hook({ trigger: c.trigger, name: 'onEnable', ctx });
      const baseline = data.get(c.key);
      items = c.after();
      await hook({ trigger: c.trigger, name: 'onDisable', ctx });
      expect(data.get(c.key)).toEqual(baseline);
      await hook({ trigger: c.trigger, name: 'onEnable', ctx: { ...ctx, isRepublish: true } });
      expect(data.get(c.key)).toEqual(baseline);
      expect(await hook({ trigger: c.trigger, name: 'run', ctx })).toHaveLength(1);
    });

    test(`${c.name}: turning the flow off and on starts fresh`, async () => {
      const { store } = memoryStore();
      let items: unknown[] = c.before();
      stubFetch(() => ({ status: 200, body: c.body(items) }));
      const ctx = { store, propsValue: c.propsValue };
      await hook({ trigger: c.trigger, name: 'onEnable', ctx });
      items = c.after();
      await hook({ trigger: c.trigger, name: 'onDisable', ctx });
      await hook({ trigger: c.trigger, name: 'onEnable', ctx });
      expect(await hook({ trigger: c.trigger, name: 'run', ctx })).toEqual([]);
    });
  }
});

describe('playlist triggers read snapshot_id first', () => {
  const triggersUnderTest = [
    { name: 'new_playlist_item', trigger: newPlaylistItem, key: 'new_playlist_item_checkpoint' },
    { name: 'playlist_items_changed', trigger: playlistItemsChanged, key: 'playlist_changed_trigger_hash_v2' },
  ];

  function playlistApi() {
    const state = { snapshot: 'snap-1', items: [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' })] };
    const seen = stubFetch((url) => {
      if (url.pathname === `/v1/playlists/${PL}`) {
        return { status: 200, body: { snapshot_id: state.snapshot } };
      }
      return { status: 200, body: { items: state.items, next: null, total: state.items.length } };
    });
    return { state, seen };
  }

  for (const c of triggersUnderTest) {
    test(`${c.name}: an idle poll is one request and the snapshot is stored with the checkpoint`, async () => {
      const { store, data } = memoryStore();
      const { seen } = playlistApi();
      const ctx = { store, propsValue: { playlist_id: PL } };
      await hook({ trigger: c.trigger, name: 'onEnable', ctx });
      expect(seen[0].searchParams.get('fields')).toBe('snapshot_id');
      expect(data.get(c.key)).toMatchObject({ playlistId: PL, snapshotId: 'snap-1' });
      const before = seen.length;
      expect(await hook({ trigger: c.trigger, name: 'run', ctx })).toEqual([]);
      expect(seen.length - before).toBe(1);
      expect(seen[before].pathname).toBe(`/v1/playlists/${PL}`);
    });

    test(`${c.name}: a new snapshot triggers the full read and fires`, async () => {
      const { store, data } = memoryStore();
      const { state, seen } = playlistApi();
      const ctx = { store, propsValue: { playlist_id: PL } };
      await hook({ trigger: c.trigger, name: 'onEnable', ctx });
      state.snapshot = 'snap-2';
      state.items = [...state.items, playlistEntry({ n: 2, addedAt: '2026-01-02T00:00:00Z' })];
      expect(await hook({ trigger: c.trigger, name: 'run', ctx })).toHaveLength(1);
      expect(data.get(c.key)).toMatchObject({ snapshotId: 'snap-2' });
      const before = seen.length;
      expect(await hook({ trigger: c.trigger, name: 'run', ctx })).toEqual([]);
      expect(seen.length - before).toBe(1);
    });

    test(`${c.name}: a snapshot change with nothing to fire still saves the snapshot`, async () => {
      const { store, data } = memoryStore();
      const { state, seen } = playlistApi();
      const ctx = { store, propsValue: { playlist_id: PL } };
      await hook({ trigger: c.trigger, name: 'onEnable', ctx });
      state.snapshot = 'snap-2';
      expect(await hook({ trigger: c.trigger, name: 'run', ctx })).toEqual([]);
      expect(data.get(c.key)).toMatchObject({ snapshotId: 'snap-2' });
      const before = seen.length;
      await hook({ trigger: c.trigger, name: 'run', ctx });
      expect(seen.length - before).toBe(1);
    });

    test(`${c.name}: a stored checkpoint without a snapshot does the full read`, async () => {
      const { store, data } = memoryStore();
      const { state, seen } = playlistApi();
      const ctx = { store, propsValue: { playlist_id: PL } };
      await hook({ trigger: c.trigger, name: 'onEnable', ctx });
      const withoutSnapshot = { ...Object(data.get(c.key)) };
      delete withoutSnapshot.snapshotId;
      data.set(c.key, withoutSnapshot);
      state.items = [...state.items, playlistEntry({ n: 2, addedAt: '2026-01-02T00:00:00Z' })];
      const before = seen.length;
      expect(await hook({ trigger: c.trigger, name: 'run', ctx })).toHaveLength(1);
      expect(seen.length - before).toBeGreaterThan(1);
      expect(data.get(c.key)).toMatchObject({ snapshotId: 'snap-1' });
    });

    test(`${c.name}: a response without snapshot_id never skips the read`, async () => {
      const { store } = memoryStore();
      let items: unknown[] = [playlistEntry({ n: 1, addedAt: '2026-01-01T00:00:00Z' })];
      stubFetch(() => ({ status: 200, body: { items, next: null, total: items.length } }));
      const ctx = { store, propsValue: { playlist_id: PL } };
      await hook({ trigger: c.trigger, name: 'onEnable', ctx });
      items = [...items, playlistEntry({ n: 2, addedAt: '2026-01-02T00:00:00Z' })];
      expect(await hook({ trigger: c.trigger, name: 'run', ctx })).toHaveLength(1);
    });
  }
});

type FakeResponse = { status: number; body: unknown };

import { afterEach, describe, expect, test, vi } from 'vitest';
import { spotify } from '../src';
import actions from '../src/lib/actions';
import search from '../src/lib/actions/search';
import createPlaylist from '../src/lib/actions/create-playlist';
import getPlaylistItems from '../src/lib/actions/get-playlist-items';
import getPlaylistInfo from '../src/lib/actions/get-playlist-info';
import getPlaylists from '../src/lib/actions/get-playlists';
import getSavedTracks from '../src/lib/actions/get-saved-tracks';
import addPlaylistItems from '../src/lib/actions/add-playlist-items';
import removePlaylistItems from '../src/lib/actions/remove-playlist-items';
import replacePlaylistItems from '../src/lib/actions/replace-playlist-items';
import addLibraryItems from '../src/lib/actions/add-library-items';
import removeLibraryItems from '../src/lib/actions/remove-library-items';
import getArtistAlbums from '../src/lib/actions/get-artist-albums';
import getCurrentUser from '../src/lib/actions/get-current-user';
import checkLibraryItems from '../src/lib/actions/check-library-items';
import getPlaybackState from '../src/lib/actions/get-playback-state';
import pause from '../src/lib/actions/pause';
import play from '../src/lib/actions/play';
import setVolume from '../src/lib/actions/set-volume';
import updatePlaylist from '../src/lib/actions/update-playlist';
import updatePlaylistDetails from '../src/lib/actions/update-playlist-details';
import transferPlayback from '../src/lib/actions/transfer-playback';
import getFollowedArtists from '../src/lib/actions/get-followed-artists';
import getTrack from '../src/lib/actions/get-track';
import getSavedItems from '../src/lib/actions/get-saved-items';
import addToQueue from '../src/lib/actions/add-to-queue';
import seek from '../src/lib/actions/seek';
import { SpotifyApiError } from '../src/lib/common/errors';
import { SpotifyWebApi } from '../src/lib/common/client';

const AUTH = { access_token: 'TKN', data: {}, props: {} };
const PL = '3cEYpjA9oz9GiPac4AsH4n';
const TR = '4cOdK2wGLETKBW3PvgPWqT';

function trackUri(index: number): string {
  return `spotify:track:${String(index).padStart(22, 'A')}`;
}

function stubFetch(respond: (request: Seen) => FakeResponse): Seen[] {
  const seen: Seen[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit & { dispatcher?: unknown }) => {
      const url = new URL(String(input));
      const request: Seen = {
        url,
        method: (init?.method ?? 'GET').toUpperCase(),
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
        auth: new Headers(init?.headers).get('authorization'),
        dispatcher: init?.dispatcher,
      };
      seen.push(request);
      const r = respond(request);
      if (r.status === 204) {
        return new Response(null, { status: 204 });
      }
      return new Response(r.body === undefined ? '' : JSON.stringify(r.body), {
        status: r.status,
        headers: { 'content-type': 'application/json' },
      });
    })
  );
  return seen;
}

function run({ action, propsValue }: { action: unknown; propsValue: Record<string, unknown> }): Promise<unknown> {
  const fn: unknown = Reflect.get(Object(action), 'run');
  if (typeof fn !== 'function') {
    throw new Error('action has no run');
  }
  return Reflect.apply(fn, action, [{ auth: AUTH, propsValue }]);
}

async function failure(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected the promise to reject');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('piece metadata', () => {
  test('minimumSupportedRelease is 0.88.2', () => {
    expect(spotify.minimumSupportedRelease).toBe('0.88.2');
  });

  test('update_playlist is human, its twin is ai, all other actions are both', () => {
    const audience = Object.fromEntries(actions.map((a) => [a.name, a.audience]));
    expect(audience['update_playlist']).toBe('human');
    expect(audience['update_playlist_details']).toBe('ai');
    const others = actions.filter((a) => a.name !== 'update_playlist' && a.name !== 'update_playlist_details');
    expect(others.every((a) => a.audience === 'both')).toBe(true);
    expect(actions).toHaveLength(41);
  });

  test('every action has an outputSchema, aiMetadata and a classification', () => {
    for (const action of actions) {
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(action.classification, action.name).toBeTruthy();
    }
  });

  test('the ai twin uses string yes/no dropdowns, never booleans', () => {
    const props = updatePlaylistDetails.props;
    for (const key of ['public', 'collaborative'] as const) {
      const prop = props[key];
      expect(prop.type).toBe('STATIC_DROPDOWN');
      const values = prop.options.options.map((o) => o.value);
      expect(values).toEqual(['yes', 'no']);
    }
  });
});

describe('transport', () => {
  test('sends the bearer token with a TLS-verifying dispatcher and Accept json', async () => {
    const seen = stubFetch(() => ({ status: 200, body: { id: 'u', display_name: 'U', type: 'user', uri: 'spotify:user:u' } }));
    await new SpotifyWebApi('TKN').getCurrentUser();
    expect(seen[0].auth).toBe('Bearer TKN');
    expect(seen[0].dispatcher).toBeDefined();
    expect(seen[0].url.origin).toBe('https://api.spotify.com');
  });
});

describe('search (P1: Albums value is empty string)', () => {
  test("['', 'track'] sends type=album,track", async () => {
    const seen = stubFetch(() => ({ status: 200, body: {} }));
    await run({ action: search, propsValue: { search_text: 'never gonna', types: ['', 'track'] } });
    expect(seen[0].url.pathname).toBe('/v1/search');
    expect(seen[0].url.searchParams.get('type')).toBe('album,track');
    expect(seen[0].url.searchParams.get('q')).toBe('never gonna');
  });

  test("Albums alone sends type=album, duplicates are removed", async () => {
    const seen = stubFetch(() => ({ status: 200, body: {} }));
    await run({ action: search, propsValue: { search_text: 'x', types: ['', 'album', 'show'] } });
    expect(seen[0].url.searchParams.get('type')).toBe('album,show');
  });

  test('null playlist entries are dropped and new keys are returned', async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        playlists: { items: [null, { id: PL, name: 'P', uri: `spotify:playlist:${PL}` }] },
        shows: { items: [{ id: 's', name: 'S', uri: 'spotify:show:s' }] },
      },
    }));
    const out = await run({ action: search, propsValue: { search_text: 'x', types: ['playlist', 'show'] } });
    expect(out).toMatchObject({ playlists: [{ id: PL }], shows: [{ id: 's' }] });
  });

  test('limit out of range fails before any request', async () => {
    const seen = stubFetch(() => ({ status: 200, body: {} }));
    await expect(run({ action: search, propsValue: { search_text: 'x', types: ['track'], limit: 51 } })).rejects.toThrow(/Limit must be a whole number between 1 and 50/);
    expect(seen).toHaveLength(0);
  });
});

describe('create_playlist (P1: POST /users/{id}/playlists removed)', () => {
  test('posts to /me/playlists without a GET /me', async () => {
    const seen = stubFetch(() => ({ status: 201, body: { id: PL, name: 'Mix', uri: `spotify:playlist:${PL}` } }));
    const out = await run({ action: createPlaylist, propsValue: { name: 'Mix', description: 'd', public: false, collaborative: true } });
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('POST');
    expect(seen[0].url.pathname).toBe('/v1/me/playlists');
    expect(seen[0].body).toEqual({ name: 'Mix', description: 'd', public: false, collaborative: true });
    expect(out).toMatchObject({ id: PL });
  });

  test('collaborative without public=false is rejected before the request', async () => {
    const seen = stubFetch(() => ({ status: 201, body: {} }));
    await expect(run({ action: createPlaylist, propsValue: { name: 'Mix', collaborative: true } })).rejects.toThrow(/collaborative playlist must be private/);
    expect(seen).toHaveLength(0);
  });
});

describe('get_playlist_items (P1: /tracks removed)', () => {
  test('calls /items with additional_types and returns item and track', async () => {
    const media = { id: TR, name: 'T', uri: `spotify:track:${TR}` };
    const seen = stubFetch(() => ({
      status: 200,
      body: { items: [{ added_at: '2026-01-01T00:00:00Z', is_local: false, item: media }, { added_at: '2026-01-01T00:00:00Z', is_local: false, item: null }], next: null, total: 2 },
    }));
    const out = await run({ action: getPlaylistItems, propsValue: { playlist_id: `https://open.spotify.com/playlist/${PL}?si=x`, limit: 10, offset: 5 } });
    expect(seen[0].url.pathname).toBe(`/v1/playlists/${PL}/items`);
    expect(seen[0].url.searchParams.get('additional_types')).toBe('track,episode');
    expect(seen[0].url.searchParams.get('limit')).toBe('10');
    expect(seen[0].url.searchParams.get('offset')).toBe('5');
    expect(out).toMatchObject({ items: [{ item: media, track: media }, { item: null, track: null }] });
  });

  test('older shape keyed on track is normalised too', async () => {
    const media = { id: TR, name: 'T', uri: `spotify:track:${TR}` };
    stubFetch(() => ({ status: 200, body: { items: [{ added_at: null, is_local: false, track: media }], next: null } }));
    const out = await run({ action: getPlaylistItems, propsValue: { playlist_id: PL } });
    expect(out).toMatchObject({ items: [{ item: media, track: media }] });
  });

  test('an invalid playlist value never reaches the URL', async () => {
    const seen = stubFetch(() => ({ status: 200, body: {} }));
    await expect(run({ action: getPlaylistItems, propsValue: { playlist_id: '../../me/tracks' } })).rejects.toThrow(/not a valid Spotify playlist ID/);
    expect(seen).toHaveLength(0);
  });

  test('playlist info normalises the embedded items page', async () => {
    const media = { id: TR, name: 'T', uri: `spotify:track:${TR}` };
    const seen = stubFetch(() => ({ status: 200, body: { id: PL, name: 'P', uri: `spotify:playlist:${PL}`, items: { total: 1, items: [{ added_at: 'x', is_local: false, item: media }] } } }));
    const out = await run({ action: getPlaylistInfo, propsValue: { playlist_id: `spotify:playlist:${PL}`, market: 'de' } });
    expect(seen[0].url.pathname).toBe(`/v1/playlists/${PL}`);
    expect(seen[0].url.searchParams.get('market')).toBe('DE');
    expect(out).toMatchObject({ items: { items: [{ item: media, track: media }] } });
  });

  test('playlist info exposes a tracks-shaped response under items and keeps tracks', async () => {
    const media = { id: TR, name: 'T', uri: `spotify:track:${TR}` };
    stubFetch(() => ({ status: 200, body: { id: PL, name: 'P', uri: `spotify:playlist:${PL}`, tracks: { total: 1, items: [{ added_at: 'x', is_local: false, track: media }] } } }));
    const out = await run({ action: getPlaylistInfo, propsValue: { playlist_id: PL } });
    expect(out).toMatchObject({
      items: { total: 1, items: [{ item: media, track: media }] },
      tracks: { total: 1, items: [{ item: media, track: media }] },
    });
  });

  test('playlist info with an items-shaped response adds no tracks key', async () => {
    stubFetch(() => ({ status: 200, body: { id: PL, name: 'P', uri: `spotify:playlist:${PL}`, items: { total: 0, items: [] } } }));
    const out = await run({ action: getPlaylistInfo, propsValue: { playlist_id: PL } });
    expect(out).toMatchObject({ items: { total: 0, items: [] } });
    expect(out).not.toHaveProperty('tracks');
  });
});

describe('pagination', () => {
  test('All follows offsets and stops on next = null', async () => {
    const seen = stubFetch(({ url }) => {
      const offset = Number(url.searchParams.get('offset'));
      return offset === 0
        ? { status: 200, body: { items: Array.from({ length: 50 }, (_, i) => ({ id: `p${i}`, name: `P${i}` })), next: 'https://api.spotify.com/v1/me/playlists?offset=50', total: 999 } }
        : { status: 200, body: { items: [{ id: 'last', name: 'Last' }], next: null, total: 999 } };
    });
    const out = await run({ action: getPlaylists, propsValue: { all: true } });
    expect(seen.map((s) => s.url.searchParams.get('offset'))).toEqual(['0', '50']);
    expect(seen.every((s) => s.url.searchParams.get('limit') === '50')).toBe(true);
    expect(out).toMatchObject({ total: 51, has_more: false });
  });

  test('an empty page stops the loop even when next is set and total is larger', async () => {
    const seen = stubFetch(() => ({ status: 200, body: { items: [], next: 'https://api.spotify.com/v1/me/tracks?offset=50', total: 500 } }));
    const out = await run({ action: getSavedTracks, propsValue: { all: true } });
    expect(seen).toHaveLength(1);
    expect(out).toMatchObject({ total: 0, items: [], has_more: false });
  });

  test('the page budget caps the loop and reports has_more', async () => {
    const seen = stubFetch(() => ({ status: 200, body: { items: [{ id: 'x' }], next: 'https://api.spotify.com/v1/next', total: 1_000_000 } }));
    const res = await new SpotifyWebApi('TKN').getAllCurrentUserPlaylists({ maxPages: 3 });
    expect(seen).toHaveLength(3);
    expect(seen.map((s) => s.url.searchParams.get('offset'))).toEqual(['0', '1', '2']);
    expect(res.hasMore).toBe(true);
  });

  test('followed artists page on the after cursor', async () => {
    const seen = stubFetch(({ url }) =>
      url.searchParams.get('after') === null
        ? { status: 200, body: { artists: { items: [{ id: 'a1' }], next: 'n', cursors: { after: 'a1' }, total: 2 } } }
        : { status: 200, body: { artists: { items: [{ id: 'a2' }], next: null, cursors: { after: null }, total: 2 } } }
    );
    const out = await run({ action: getFollowedArtists, propsValue: { all: true } });
    expect(seen.map((s) => s.url.searchParams.get('after'))).toEqual([null, 'a1']);
    expect(seen[0].url.searchParams.get('type')).toBe('artist');
    expect(out).toMatchObject({ total: 2, items: [{ id: 'a1' }, { id: 'a2' }], has_more: false });
  });
});

describe('live round', () => {
  test('pause is not idempotent and says why', () => {
    expect(pause.aiMetadata?.idempotent).toBe(false);
    expect(pause.aiMetadata?.description).toContain('Restriction violated');
  });

  test('403 Forbidden on playlist items carries the dev-mode hint', async () => {
    stubFetch(() => ({ status: 403, body: { error: { status: 403, message: 'Forbidden' } } }));
    const error = await failure(run({ action: getPlaylistItems, propsValue: { playlist_id: PL } }));
    expect(error).toMatchObject({ status: 403 });
    expect(String(Reflect.get(Object(error), 'message'))).toBe(
      'Spotify could not read the playlist items (403): Forbidden. Development-mode Spotify apps can only read items of playlists the user owns or collaborates on.'
    );
  });

  test('403 Forbidden elsewhere gets no playlist hint', async () => {
    stubFetch(() => ({ status: 403, body: { error: { status: 403, message: 'Forbidden' } } }));
    const error = await failure(run({ action: getPlaylistInfo, propsValue: { playlist_id: PL } }));
    expect(String(Reflect.get(Object(error), 'message'))).toBe('Spotify could not read the playlist (403): Forbidden.');
  });

  test('search limit above 50 explains the dev-mode cap of 10', async () => {
    stubFetch(() => ({ status: 200, body: {} }));
    await expect(run({ action: search, propsValue: { search_text: 'x', types: ['track'], limit: 60 } })).rejects.toThrow(/between 1 and 50\. Development-mode Spotify apps return a 400 error above 10\./);
  });

  test('schema matches live captures: timestamp is epoch ms, artist has no genres', () => {
    const playback = getPlaybackState.outputSchema?.fields ?? [];
    expect(playback.find((f) => f.key === 'timestamp')).toMatchObject({ format: 'number', label: 'Timestamp (epoch ms)' });
    expect(playback.some((f) => f.key === 'smart_shuffle')).toBe(true);
    const artists = search.outputSchema?.fields.find((f) => f.key === 'artists')?.listItems ?? [];
    expect(artists.some((f) => f.key === 'genres')).toBe(false);
    expect(removePlaylistItems.outputSchema?.fields.find((f) => f.key === 'removed')?.label).toBe('Items Sent for Removal');
    expect(addLibraryItems.outputSchema?.fields.find((f) => f.key === 'count')?.label).toBe('Items Sent');
  });
});

describe('followed artists guard', () => {
  test('a body without artists gives a clear error', async () => {
    stubFetch(() => ({ status: 200, body: {} }));
    await expect(run({ action: getFollowedArtists, propsValue: {} })).rejects.toThrow(/no "artists" object/);
  });
});

describe('chunking', () => {
  test('101 playlist URIs → two POSTs of 100 and 1, position advances', async () => {
    let call = 0;
    const seen = stubFetch(() => ({ status: 201, body: { snapshot_id: `snap${++call}` } }));
    const items = Array.from({ length: 101 }, (_, i) => trackUri(i));
    const out = await run({ action: addPlaylistItems, propsValue: { playlist_id: PL, items, position: 5 } });
    expect(seen).toHaveLength(2);
    expect(seen[0].url.pathname).toBe(`/v1/playlists/${PL}/items`);
    expect(seen[0].body).toMatchObject({ position: 5 });
    expect(seen[0].body.uris).toHaveLength(100);
    expect(seen[1].body).toEqual({ uris: [trackUri(100)], position: 105 });
    expect(out).toEqual({ playlist_id: PL, snapshot_id: 'snap2', added: 101 });
  });

  test('a failed second chunk reports progress and keeps the status', async () => {
    let call = 0;
    stubFetch(() => (++call === 1 ? { status: 201, body: { snapshot_id: 's' } } : { status: 500, body: { error: { status: 500, message: 'Server error' } } }));
    const items = Array.from({ length: 150 }, (_, i) => trackUri(i));
    const error = await failure(run({ action: addPlaylistItems, propsValue: { playlist_id: PL, items } }));
    expect(error).toBeInstanceOf(SpotifyApiError);
    expect(error).toMatchObject({ status: 500 });
    expect(String(Reflect.get(Object(error), 'message'))).toMatch(/^Added 100 of 150 items before the failure.*Server error/);
  });

  test('remove sends 100 per DELETE and chains the snapshot', async () => {
    let call = 0;
    const seen = stubFetch(() => ({ status: 200, body: { snapshot_id: `s${++call}` } }));
    const items = Array.from({ length: 120 }, (_, i) => trackUri(i));
    const out = await run({ action: removePlaylistItems, propsValue: { playlist_id: PL, items, snapshot_id: 'start' } });
    expect(seen.map((s) => s.method)).toEqual(['DELETE', 'DELETE']);
    expect(seen[0].body.items).toHaveLength(100);
    expect(seen[0].body.snapshot_id).toBe('start');
    expect(seen[1].body.snapshot_id).toBe('s1');
    expect(out).toEqual({ playlist_id: PL, snapshot_id: 's2', removed: 120 });
  });

  test('41 library URIs → two PUTs of 40 and 1 on /me/library', async () => {
    const seen = stubFetch(() => ({ status: 200, body: undefined }));
    const items = Array.from({ length: 41 }, (_, i) => trackUri(i));
    const out = await run({ action: addLibraryItems, propsValue: { items } });
    expect(seen.map((s) => `${s.method} ${s.url.pathname}`)).toEqual(['PUT /v1/me/library', 'PUT /v1/me/library']);
    expect(seen[0].url.searchParams.get('uris')?.split(',')).toHaveLength(40);
    expect(seen[1].url.searchParams.get('uris')).toBe(trackUri(40));
    expect(out).toEqual({ uris: items, count: 41 });
  });

  test('check library zips the boolean answers back to the URIs', async () => {
    const seen = stubFetch(() => ({ status: 200, body: [true, false] }));
    const out = await run({ action: checkLibraryItems, propsValue: { items: [`spotify:track:${TR}`, `https://open.spotify.com/album/${TR}`] } });
    expect(seen[0].url.pathname).toBe('/v1/me/library/contains');
    expect(out).toEqual({ results: [{ uri: `spotify:track:${TR}`, saved: true }, { uri: `spotify:album:${TR}`, saved: false }] });
  });

  test('replace: PUT the first 100 then POST the rest', async () => {
    let call = 0;
    const seen = stubFetch(() => ({ status: 200, body: { snapshot_id: `s${++call}` } }));
    const items = Array.from({ length: 250 }, (_, i) => trackUri(i));
    const out = await run({ action: replacePlaylistItems, propsValue: { playlist_id: PL, items } });
    expect(seen.map((s) => s.method)).toEqual(['PUT', 'POST', 'POST']);
    expect(seen.map((s) => s.body.uris.length)).toEqual([100, 100, 50]);
    expect(out).toEqual({ playlist_id: PL, snapshot_id: 's3', replaced: 100, appended: 150 });
  });

  test('replace: a failed append reports how much of the playlist was written', async () => {
    let call = 0;
    stubFetch(() => (++call <= 2 ? { status: 200, body: { snapshot_id: 's' } } : { status: 429, body: { error: { status: 429, message: 'API rate limit exceeded' } } }));
    const items = Array.from({ length: 250 }, (_, i) => trackUri(i));
    const error = await failure(run({ action: replacePlaylistItems, propsValue: { playlist_id: PL, items } }));
    expect(error).toMatchObject({ status: 429 });
    expect(String(Reflect.get(Object(error), 'message'))).toMatch(/holds only 200 of 250 items.*API rate limit exceeded/);
  });

  test('replace: clearing needs the explicit checkbox', async () => {
    const seen = stubFetch(() => ({ status: 200, body: { snapshot_id: 's' } }));
    await expect(run({ action: replacePlaylistItems, propsValue: { playlist_id: PL, items: [] } })).rejects.toThrow(/Empty Playlist/);
    expect(seen).toHaveLength(0);
    await run({ action: replacePlaylistItems, propsValue: { playlist_id: PL, items: [], clear_all: true } });
    expect(seen[0]).toMatchObject({ method: 'PUT', body: { uris: [] } });
  });
});

describe('player', () => {
  test('204 playback state → documented idle object', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    const out = await run({ action: getPlaybackState, propsValue: {} });
    expect(seen[0].url.searchParams.get('additional_types')).toBe('track,episode');
    expect(out).toEqual({ is_playing: false, device: null, item: null });
  });

  test('PREMIUM_REQUIRED keeps status and vendor text, adds the hint, has no body field', async () => {
    stubFetch(() => ({ status: 403, body: { error: { status: 403, message: 'Player command failed: Premium required', reason: 'PREMIUM_REQUIRED' } } }));
    const error = await failure(run({ action: pause, propsValue: {} }));
    expect(error).toBeInstanceOf(SpotifyApiError);
    expect(error).toMatchObject({ status: 403, reason: 'PREMIUM_REQUIRED' });
    const message = String(Reflect.get(Object(error), 'message'));
    expect(message).toContain('(403 PREMIUM_REQUIRED): Player command failed: Premium required');
    expect(message).toContain('Spotify Premium');
    expect(Object.keys(Object(error))).not.toContain('body');
    expect(Reflect.get(Object(error), 'responseBody')).toMatchObject({ error: { reason: 'PREMIUM_REQUIRED' } });
  });

  test('NO_ACTIVE_DEVICE adds the open-a-device hint', async () => {
    stubFetch(() => ({ status: 404, body: { error: { status: 404, message: 'Player command failed: No active device found', reason: 'NO_ACTIVE_DEVICE' } } }));
    const error = await failure(run({ action: pause, propsValue: {} }));
    expect(error).toMatchObject({ status: 404 });
    expect(String(Reflect.get(Object(error), 'message'))).toMatch(/No active device found\..*Open Spotify/);
  });

  test('an unmapped error keeps status and vendor text without a hint', async () => {
    stubFetch(() => ({ status: 400, body: { error: { status: 400, message: 'Invalid base62 id' } } }));
    const error = await failure(run({ action: pause, propsValue: {} }));
    expect(String(Reflect.get(Object(error), 'message'))).toBe('Spotify could not pause playback (400): Invalid base62 id.');
  });

  test('play sends an immutable body with the offset, device in the query', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    const out = await run({ action: play, propsValue: { device_id: 'dev1', context_uri: `https://open.spotify.com/album/${TR}`, offset_position: 2 } });
    expect(seen[0].url.pathname).toBe('/v1/me/player/play');
    expect(seen[0].url.searchParams.get('device_id')).toBe('dev1');
    expect(seen[0].body).toEqual({ context_uri: `spotify:album:${TR}`, offset: { position: 2 } });
    expect(out).toEqual({ success: true, device_id: 'dev1' });
  });

  test('play passes any well-formed spotify: context URI through unchanged', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    await run({ action: play, propsValue: { context_uri: 'spotify:user:abc:collection' } });
    await run({ action: play, propsValue: { context_uri: `spotify:user:abc:playlist:${PL}` } });
    expect(seen[0].body).toEqual({ context_uri: 'spotify:user:abc:collection' });
    expect(seen[1].body).toEqual({ context_uri: `spotify:user:abc:playlist:${PL}` });
    await expect(run({ action: play, propsValue: { context_uri: 'spotify:album:' } })).rejects.toThrow(/not a well-formed Spotify URI/);
    await expect(run({ action: play, propsValue: { context_uri: `https://evil.example/album/${TR}` } })).rejects.toThrow(/not a Spotify link/);
    expect(seen).toHaveLength(2);
  });

  test('play accepts local file URIs in tracks', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    await run({ action: play, propsValue: { tracks: ['spotify:local:Artist:Album:Title:180', `https://open.spotify.com/track/${TR}`] } });
    expect(seen[0].body).toEqual({ uris: ['spotify:local:Artist:Album:Title:180', `spotify:track:${TR}`] });
  });

  test('play rejects a context together with tracks', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    await expect(run({ action: play, propsValue: { context_uri: `spotify:album:${TR}`, tracks: [`spotify:track:${TR}`] } })).rejects.toThrow(/either Play From or Tracks/);
    expect(seen).toHaveLength(0);
  });

  test('volume is range checked', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    await expect(run({ action: setVolume, propsValue: { volume: 101 } })).rejects.toThrow(/between 0 and 100/);
    await expect(run({ action: setVolume, propsValue: { volume: '50.5' } })).rejects.toThrow(/whole number/);
    expect(seen).toHaveLength(0);
    expect(await run({ action: setVolume, propsValue: { volume: '40' } })).toEqual({ success: true, volume_percent: 40, device_id: null });
    expect(seen[0].url.searchParams.get('volume_percent')).toBe('40');
  });

  test('transfer playback omits play when unset and maps yes/no', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    await run({ action: transferPlayback, propsValue: { device_id: 'dev1' } });
    await run({ action: transferPlayback, propsValue: { device_id: 'dev1', play: 'no' } });
    expect(seen[0].body).toEqual({ device_ids: ['dev1'] });
    expect(seen[1].body).toEqual({ device_ids: ['dev1'], play: false });
  });
});

describe('update playlist', () => {
  test('ai twin maps yes/no and omits unset fields', async () => {
    const seen = stubFetch(() => ({ status: 200, body: undefined }));
    const out = await run({ action: updatePlaylistDetails, propsValue: { playlist_id: `spotify:playlist:${PL}`, name: 'Renamed', public: 'no' } });
    expect(seen[0].method).toBe('PUT');
    expect(seen[0].url.pathname).toBe(`/v1/playlists/${PL}`);
    expect(seen[0].body).toEqual({ name: 'Renamed', public: false });
    expect(out).toEqual({ playlist_id: PL, updated: ['name', 'public'] });
  });

  test('ai twin rename alone never touches public or collaborative', async () => {
    const seen = stubFetch(() => ({ status: 200, body: undefined }));
    await run({ action: updatePlaylistDetails, propsValue: { playlist_id: PL, name: 'Only name' } });
    expect(seen[0].body).toEqual({ name: 'Only name' });
  });

  test('ai twin rejects an empty update and public + collaborative', async () => {
    const seen = stubFetch(() => ({ status: 200, body: undefined }));
    await expect(run({ action: updatePlaylistDetails, propsValue: { playlist_id: PL } })).rejects.toThrow(/Nothing to update/);
    await expect(run({ action: updatePlaylistDetails, propsValue: { playlist_id: PL, public: 'yes', collaborative: 'yes' } })).rejects.toThrow(/public and collaborative/);
    await expect(run({ action: updatePlaylistDetails, propsValue: { playlist_id: PL, public: 'maybe' } })).rejects.toThrow(/"yes" or "no"/);
    expect(seen).toHaveLength(0);
  });

  test('human action sends sharing only with Change Sharing and rejects an empty update', async () => {
    const seen = stubFetch(() => ({ status: 200, body: undefined }));
    await expect(run({ action: updatePlaylist, propsValue: { playlist_id: PL } })).rejects.toThrow(/Nothing to update/);
    await expect(run({ action: updatePlaylist, propsValue: { playlist_id: PL, public: false, collaborative: false } })).rejects.toThrow(/Nothing to update/);
    const out = await run({ action: updatePlaylist, propsValue: { playlist_id: PL, description: 'd', public: false, collaborative: false } });
    expect(seen[0].body).toEqual({ description: 'd' });
    expect(out).toEqual({ playlist_id: PL, updated: ['description'] });
    const shared = await run({ action: updatePlaylist, propsValue: { playlist_id: PL, change_sharing: true, public: false } });
    expect(seen[1].body).toEqual({ public: false, collaborative: false });
    expect(shared).toEqual({ playlist_id: PL, updated: ['public', 'collaborative'] });
  });

  test('an empty description is kept on the human action and cleared on the ai twin', async () => {
    const seen = stubFetch(() => ({ status: 200, body: undefined }));
    await run({ action: updatePlaylist, propsValue: { playlist_id: PL, name: 'N', description: '' } });
    await run({ action: updatePlaylistDetails, propsValue: { playlist_id: PL, description: '  ' } });
    await run({ action: updatePlaylistDetails, propsValue: { playlist_id: PL, name: 'N' } });
    expect(seen.map((r) => r.body)).toEqual([{ name: 'N' }, { description: '' }, { name: 'N' }]);
  });

  test('seek is not marked idempotent', () => {
    expect(seek.aiMetadata?.idempotent).toBe(false);
  });
});

describe('qa edge cases', () => {
  test('429 rate limit keeps the status and vendor text and is not retried', async () => {
    const seen = stubFetch(() => ({ status: 429, body: { error: { status: 429, message: 'API rate limit exceeded' } } }));
    const error = await failure(run({ action: getTrack, propsValue: { id: TR } }));
    expect(error).toBeInstanceOf(SpotifyApiError);
    expect(error).toMatchObject({ status: 429 });
    expect(String(Reflect.get(Object(error), 'message'))).toBe('Spotify could not read the track (429): API rate limit exceeded.');
    expect(seen).toHaveLength(1);
  });

  test('401 auth failure keeps the OAuth error text', async () => {
    stubFetch(() => ({ status: 401, body: { error: { status: 401, message: 'The access token expired' } } }));
    const error = await failure(run({ action: getTrack, propsValue: { id: TR } }));
    expect(error).toMatchObject({ status: 401 });
    expect(String(Reflect.get(Object(error), 'message'))).toContain('The access token expired');
  });

  test('a 200 with an empty body on a read fails instead of returning undefined', async () => {
    stubFetch(() => ({ status: 200, body: undefined }));
    await expect(run({ action: getTrack, propsValue: { id: TR } })).rejects.toThrow(/empty response \(200\)/);
  });

  test('a non-JSON error body is surfaced as text', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Bad gateway</html>', { status: 502 })));
    const error = await failure(run({ action: getTrack, propsValue: { id: TR } }));
    expect(error).toMatchObject({ status: 502 });
    expect(String(Reflect.get(Object(error), 'message'))).toContain('Bad gateway');
  });

  test('a track link is reduced to the ID before it reaches the path', async () => {
    const seen = stubFetch(() => ({ status: 200, body: { id: TR } }));
    await run({ action: getTrack, propsValue: { id: `https://open.spotify.com/intl-de/track/${TR}?si=abc` } });
    expect(seen[0].url.pathname).toBe(`/v1/tracks/${TR}`);
    expect(seen[0].url.searchParams.get('si')).toBeNull();
  });

  test('a lookalike-host link or wrong kind sends no request', async () => {
    const seen = stubFetch(() => ({ status: 200, body: {} }));
    await expect(run({ action: getTrack, propsValue: { id: `https://open.spotify.com.evil.io/track/${TR}` } })).rejects.toThrow(/not a Spotify link/);
    await expect(run({ action: getTrack, propsValue: { id: `spotify:album:${TR}` } })).rejects.toThrow(/not a Spotify track URI/);
    expect(seen).toHaveLength(0);
  });

  test('saved items routes each type to its own endpoint and rejects tracks', async () => {
    const seen = stubFetch(() => ({ status: 200, body: { items: [], next: null, total: 0 } }));
    await run({ action: getSavedItems, propsValue: { type: 'shows' } });
    expect(seen[0].url.pathname).toBe('/v1/me/shows');
    await expect(run({ action: getSavedItems, propsValue: { type: 'tracks' } })).rejects.toThrow();
    expect(seen).toHaveLength(1);
  });

  test('get playlists page drops null entries', async () => {
    stubFetch(() => ({ status: 200, body: { items: [null, { id: PL, name: 'P' }], next: null, total: 2 } }));
    const out = await run({ action: getPlaylists, propsValue: {} });
    expect(out).toMatchObject({ items: [{ id: PL }] });
    expect(Reflect.get(Object(out), 'items')).toHaveLength(1);
  });

  test('playlist dropdown shows the vendor reason when the request fails', async () => {
    stubFetch(() => ({ status: 403, body: { error: { status: 403, message: 'User not registered in the Developer Dashboard' } } }));
    const dropdown = updatePlaylist.props.playlist_id;
    const options: unknown = Reflect.get(Object(dropdown), 'options');
    if (typeof options !== 'function') {
      throw new Error('no options');
    }
    const out = await Reflect.apply(options, dropdown, [{ auth: AUTH }, {}]);
    expect(out).toMatchObject({ disabled: true, options: [] });
    expect(String(Reflect.get(Object(out), 'placeholder'))).toContain('User not registered');
  });

  test('add to queue rejects an album URI before any request', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    await expect(run({ action: addToQueue, propsValue: { uri: `spotify:album:${TR}` } })).rejects.toThrow();
    expect(seen).toHaveLength(0);
    await run({ action: addToQueue, propsValue: { uri: `spotify:episode:${TR}` } });
    expect(seen[0].url.searchParams.get('uri')).toBe(`spotify:episode:${TR}`);
  });
});

describe('get_artist_albums (Spotify max limit 10)', () => {
  const ARTIST = '0gxyHStUsqpMadRV0Di1Qt';

  test('All mode pages by 10 and follows the offset', async () => {
    const releases = Array.from({ length: 23 }, (_, i) => ({ id: `al${i}` }));
    const seen = stubFetch(({ url }) => {
      const offset = Number(url.searchParams.get('offset'));
      const limit = Number(url.searchParams.get('limit'));
      const items = releases.slice(offset, offset + limit);
      return { status: 200, body: { items, next: offset + limit < releases.length ? 'n' : null, total: releases.length } };
    });
    const out = await run({ action: getArtistAlbums, propsValue: { id: ARTIST, all: true } });
    expect(seen.map((s) => s.url.searchParams.get('limit'))).toEqual(['10', '10', '10']);
    expect(seen.map((s) => s.url.searchParams.get('offset'))).toEqual(['0', '10', '20']);
    expect(out).toEqual({ total: 23, items: releases, has_more: false });
  });

  test('Limit accepts 10 and rejects 11 before calling Spotify', async () => {
    const seen = stubFetch(() => ({ status: 200, body: { items: [], next: null, total: 0 } }));
    await run({ action: getArtistAlbums, propsValue: { id: ARTIST, limit: 10 } });
    expect(seen[0].url.searchParams.get('limit')).toBe('10');
    await expect(run({ action: getArtistAlbums, propsValue: { id: ARTIST, limit: 11 } })).rejects.toThrow(/Limit/);
    expect(seen).toHaveLength(1);
  });

  test('the Limit hint shows max 10 and default 5', () => {
    expect(getArtistAlbums.props.limit.description).toContain('1 to 10');
    expect(getArtistAlbums.props.limit.defaultValue).toBe(5);
  });
});

describe('library write kinds', () => {
  test('add and remove reject artist URIs without calling Spotify', async () => {
    const seen = stubFetch(() => ({ status: 200, body: undefined }));
    await expect(run({ action: addLibraryItems, propsValue: { items: [`spotify:artist:${TR}`] } })).rejects.toThrow();
    await expect(run({ action: removeLibraryItems, propsValue: { items: [`https://open.spotify.com/artist/${TR}`] } })).rejects.toThrow();
    expect(seen).toHaveLength(0);
  });

  test('add still accepts users and playlists', async () => {
    const seen = stubFetch(() => ({ status: 200, body: undefined }));
    await run({ action: addLibraryItems, propsValue: { items: [`spotify:playlist:${PL}`, 'spotify:user:wizzler'] } });
    expect(seen[0].url.searchParams.get('uris')).toBe(`spotify:playlist:${PL},spotify:user:wizzler`);
  });

  test('contains check still accepts artist URIs', async () => {
    const seen = stubFetch(() => ({ status: 200, body: [true] }));
    const out = await run({ action: checkLibraryItems, propsValue: { items: [`spotify:artist:${TR}`] } });
    expect(seen[0].url.searchParams.get('uris')).toBe(`spotify:artist:${TR}`);
    expect(out).toEqual({ results: [{ uri: `spotify:artist:${TR}`, saved: true }] });
  });
});

describe('get_current_user schema', () => {
  test('lists no fields this connection cannot get back', () => {
    const keys = getCurrentUser.outputSchema?.fields.map((f) => f.key) ?? [];
    expect(keys).not.toContain('email');
    expect(keys).not.toContain('product');
    expect(keys).not.toContain('country');
    expect(keys).not.toContain('followers');
    expect(getCurrentUser.aiMetadata?.description).toContain('not returned on this connection');
  });
});

describe('piece authors', () => {
  test('includes OdaiAhmed99', () => {
    expect(spotify.authors).toContain('OdaiAhmed99');
  });
});

type FakeResponse = { status: number; body?: unknown };

type Seen = {
  url: URL;
  method: string;
  body: Record<string, unknown> & { uris?: string[]; items?: unknown[] } | undefined;
  auth: string | null;
  dispatcher: unknown;
};

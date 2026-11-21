import {
  createTrigger,
  isNil,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyPolling, SpotifyCheckpoint, SpotifyPollEntry } from '../common';
import { SpotifyWebApi } from '../common/client';
import { SavedTrack } from '../common/models/library';
import { spotifyOutputSchemas } from '../output-schemas';

const CHECKPOINT_KEY = 'new_saved_track_checkpoint';
const PAGE_SIZE = 50;
const MAX_PAGES = 10;

function toEntries(items: SavedTrack[]): SpotifyPollEntry<SavedTrack>[] {
  return items.flatMap((saved) => {
    const ms = spotifyPolling.epochOf(saved.added_at);
    const key = saved.track?.uri ?? saved.track?.id ?? null;
    return ms === undefined || key === null ? [] : [{ key, ms, data: saved }];
  });
}

function olderThan({ items, ms }: { items: SavedTrack[]; ms: number }): boolean {
  return items.some((item) => {
    const itemMs = spotifyPolling.epochOf(item.added_at);
    return itemMs !== undefined && itemMs < ms;
  });
}

async function fetchSince({ client, sinceMs }: { client: SpotifyWebApi; sinceMs: number | null }): Promise<SavedTrack[]> {
  const collected: SavedTrack[] = [];
  let offset = 0;
  let stopBeforeMs = sinceMs;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await client.getSavedTracks({ limit: PAGE_SIZE, offset });
    const items = Array.isArray(res.items) ? res.items : [];
    items.forEach((item) => collected.push(item));
    if (stopBeforeMs === null) {
      stopBeforeMs = toEntries(items).reduce<number | null>((max, entry) => (max === null || entry.ms > max ? entry.ms : max), null);
    }
    if (items.length === 0 || !res.next || (stopBeforeMs !== null && olderThan({ items, ms: stopBeforeMs }))) {
      return collected;
    }
    offset += items.length;
  }
  if (sinceMs === null) {
    return collected;
  }
  throw new Error(
    `More than ${PAGE_SIZE * MAX_PAGES} tracks were saved since the last check, so the trigger cannot read them all without skipping some. Turn the trigger off and on again to start watching from now.`
  );
}

export default createTrigger({
  name: 'new_saved_track',
  classification: 'READ',
  displayName: 'New Saved Track',
  description: 'Triggers when you save a track to Liked Songs.',
  aiMetadata: {
    description: "Fires once for each track newly saved to the user's Liked Songs since the last poll, emitting {added_at, track}. Tracks that were already saved when the trigger was turned on do not fire.",
  },
  auth: spotifyCommon.authentication,
  type: TriggerStrategy.POLLING,
  outputSchema: spotifyOutputSchemas['newSavedTrackTrigger'],
  props: {},
  sampleData: {
    added_at: '2026-11-05T10:15:30Z',
    track: {
      id: '4cOdK2wGLETKBW3PvgPWqT',
      name: 'Never Gonna Give You Up',
      uri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
      type: 'track',
      duration_ms: 213573,
      explicit: false,
      artists: [{ id: '0gxyHStUsqpMadRV0Di1Qt', name: 'Rick Astley', uri: 'spotify:artist:0gxyHStUsqpMadRV0Di1Qt' }],
      album: { id: '6eUW0wxWtzkFdaEFsTJto6', name: 'Whenever You Need Somebody', uri: 'spotify:album:6eUW0wxWtzkFdaEFsTJto6' },
      external_urls: { spotify: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT' },
    },
  },
  onEnable: async ({ store, auth, isRepublish }) => {
    if (isRepublish && !isNil(await store.get(CHECKPOINT_KEY, StoreScope.FLOW))) {
      return;
    }
    const client = makeClient({ auth });
    const items = await fetchSince({ client, sinceMs: null });
    await store.put(CHECKPOINT_KEY, spotifyPolling.baseline({ entries: toEntries(items) }), StoreScope.FLOW);
  },
  onDisable: async () => {
    return;
  },
  run: async ({ store, auth }) => {
    const stored = await store.get<SpotifyCheckpoint>(CHECKPOINT_KEY, StoreScope.FLOW);
    const client = makeClient({ auth });
    if (!spotifyPolling.isCheckpoint(stored)) {
      const items = await fetchSince({ client, sinceMs: null });
      await store.put(CHECKPOINT_KEY, spotifyPolling.baseline({ entries: toEntries(items) }), StoreScope.FLOW);
      return [];
    }
    const items = await fetchSince({ client, sinceMs: stored.ms });
    const result = spotifyPolling.newSince({ entries: toEntries(items), checkpoint: stored });
    if (result.emitted.length > 0) {
      await store.put(CHECKPOINT_KEY, result.checkpoint, StoreScope.FLOW);
    }
    return result.emitted;
  },
  test: async ({ auth }) => {
    const client = makeClient({ auth });
    const res = await client.getSavedTracks({ limit: 5 });
    return Array.isArray(res.items) ? res.items : [];
  },
});

import {
  createTrigger,
  isNil,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyPolling, SpotifyCheckpoint, SpotifyPollEntry } from '../common';
import { PlayHistory } from '../common/models/catalog';
import { spotifyOutputSchemas } from '../output-schemas';

const CHECKPOINT_KEY = 'new_recently_played_track_checkpoint';
const PAGE_SIZE = 50;
const MAX_PAGES = 10;

async function readPlaysSince({ client, after }: { client: ReturnType<typeof makeClient>; after: number | undefined }): Promise<PlayHistory[]> {
  const plays: PlayHistory[] = [];
  let cursor = after;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await client.getRecentlyPlayed({ limit: PAGE_SIZE, after: cursor });
    const items = Array.isArray(res.items) ? res.items : [];
    plays.push(...items);
    const nextCursor = Number(res.cursors?.after ?? NaN);
    if (items.length < PAGE_SIZE || !Number.isFinite(nextCursor) || (cursor !== undefined && nextCursor <= cursor)) {
      return plays;
    }
    cursor = nextCursor;
  }
  throw new Error(
    `More than ${MAX_PAGES * PAGE_SIZE} plays were recorded since the last check, so the trigger stopped without saving progress. Turn the trigger off and on to start again from now.`,
  );
}

function toEntries(items: PlayHistory[]): SpotifyPollEntry<PlayHistory>[] {
  return items.flatMap((play) => {
    const ms = spotifyPolling.epochOf(play.played_at);
    const key = `${play.played_at}|${play.track?.uri ?? ''}`;
    return ms === undefined ? [] : [{ key, ms, data: play }];
  });
}

export default createTrigger({
  name: 'new_recently_played_track',
  classification: 'READ',
  displayName: 'New Recently Played Track',
  description: 'Triggers when you finish playing a track (podcast episodes are not reported by Spotify)',
  aiMetadata: {
    description: 'Fires once for each track play Spotify records in the user\'s recently played history since the last poll, emitting {played_at, track, context}. Spotify records a play after the track has played for a while, and does not report podcast episodes. Plays from before the trigger was turned on do not fire. Reads every page since the last poll (up to 500 plays); beyond that the poll fails without saving progress, and turning the trigger off and on starts again from now.',
  },
  auth: spotifyCommon.authentication,
  type: TriggerStrategy.POLLING,
  outputSchema: spotifyOutputSchemas['newRecentlyPlayedTrigger'],
  props: {},
  sampleData: {
    played_at: '2026-11-05T10:15:30.123Z',
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
    context: { type: 'playlist', uri: 'spotify:playlist:3cEYpjA9oz9GiPac4AsH4n' },
  },
  onEnable: async ({ store, auth, isRepublish }) => {
    if (isRepublish && !isNil(await store.get(CHECKPOINT_KEY, StoreScope.FLOW))) {
      return;
    }
    const client = makeClient({ auth });
    const res = await client.getRecentlyPlayed({ limit: PAGE_SIZE });
    const items = Array.isArray(res.items) ? res.items : [];
    await store.put(CHECKPOINT_KEY, spotifyPolling.baseline({ entries: toEntries(items) }), StoreScope.FLOW);
  },
  onDisable: async () => {
    return;
  },
  run: async ({ store, auth }) => {
    const stored = await store.get<SpotifyCheckpoint>(CHECKPOINT_KEY, StoreScope.FLOW);
    const client = makeClient({ auth });
    if (!spotifyPolling.isCheckpoint(stored)) {
      const res = await client.getRecentlyPlayed({ limit: PAGE_SIZE });
      const items = Array.isArray(res.items) ? res.items : [];
      await store.put(CHECKPOINT_KEY, spotifyPolling.baseline({ entries: toEntries(items) }), StoreScope.FLOW);
      return [];
    }
    const items = await readPlaysSince({ client, after: stored.ms > 0 ? stored.ms - 1 : undefined });
    const result = spotifyPolling.newSince({ entries: toEntries(items), checkpoint: stored });
    if (result.emitted.length > 0) {
      await store.put(CHECKPOINT_KEY, result.checkpoint, StoreScope.FLOW);
    }
    return result.emitted;
  },
  test: async ({ auth }) => {
    const client = makeClient({ auth });
    const res = await client.getRecentlyPlayed({ limit: 5 });
    return Array.isArray(res.items) ? res.items : [];
  },
});

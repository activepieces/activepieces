import {
  createTrigger,
  MarkdownVariant,
  Property,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyPolling, SpotifyCheckpoint, SpotifyPollEntry } from '../common';
import { spotifyIds } from '../common/ids';
import { PlaylistItem } from '../common/models/playlist';
import { SPOTIFY_PLAYLIST_MAX_ITEMS, SpotifyWebApi } from '../common/client';
import { spotifyOutputSchemas } from '../output-schemas';

const CHECKPOINT_KEY = 'new_playlist_item_checkpoint';
const STABLE_READ_ATTEMPTS = 2;

function toEntries({ items, playlistId }: { items: PlaylistItem[]; playlistId: string }): SpotifyPollEntry<NewPlaylistItem>[] {
  const occurrences = new Map<string, number>();
  return items.flatMap((entry) => {
    const ms = spotifyPolling.epochOf(entry.added_at);
    if (ms === undefined) {
      return [];
    }
    const media = entry.item ?? entry.track ?? null;
    const base = `${ms}|${media?.uri ?? 'local'}`;
    const occurrence = occurrences.get(base) ?? 0;
    occurrences.set(base, occurrence + 1);
    return [{ key: `${media?.uri ?? 'local'}#${occurrence}`, ms, data: { playlist_id: playlistId, ...entry } }];
  });
}

async function fetchWindow({ client, playlistId }: { client: SpotifyWebApi; playlistId: string }): Promise<PlaylistItem[]> {
  const res = await client.getPlaylistItemsWindow({ playlistId, maxItems: SPOTIFY_PLAYLIST_MAX_ITEMS });
  if (res.hasMore) {
    throw new Error(
      'The playlist changed while it was being read; the next poll will retry.'
    );
  }
  return res.items;
}

async function fetchStableWindow({
  client,
  playlistId,
  snapshotId,
}: {
  client: SpotifyWebApi;
  playlistId: string;
  snapshotId: string | undefined;
}): Promise<{ items: PlaylistItem[]; snapshotId: string | undefined } | null> {
  let expected = snapshotId;
  for (let attempt = 0; attempt < STABLE_READ_ATTEMPTS; attempt++) {
    const items = await fetchWindow({ client, playlistId });
    if (expected === undefined) {
      return { items, snapshotId: expected };
    }
    const after = await client.getPlaylistSnapshotId({ playlistId });
    if (after === expected) {
      return { items, snapshotId: expected };
    }
    expected = after;
  }
  return null;
}

function isStored(value: unknown): value is StoredCheckpoint {
  return spotifyPolling.isCheckpoint(value) && typeof Reflect.get(value, 'playlistId') === 'string';
}

function toStored({ checkpoint, playlistId, snapshotId }: { checkpoint: SpotifyCheckpoint; playlistId: string; snapshotId: string | undefined }): StoredCheckpoint {
  return snapshotId === undefined ? { ...checkpoint, playlistId } : { ...checkpoint, playlistId, snapshotId };
}

export default createTrigger({
  name: 'new_playlist_item',
  classification: 'READ',
  displayName: 'New Playlist Item',
  description: 'Triggers when a track or episode is added to a playlist.',
  aiMetadata: {
    description: 'Fires once for each track or episode added to the watched playlist since the last poll, emitting the playlist id with the item (added_at, added_by, item). Removals and reorders do not fire, and on playlists over 10,000 items only the last 10,000 positions are watched. Items already in the playlist when the trigger was turned on are skipped.',
  },
  auth: spotifyCommon.authentication,
  type: TriggerStrategy.POLLING,
  outputSchema: spotifyOutputSchemas['newPlaylistItemTrigger'],
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    note: Property.MarkDown({
      value: 'Watches the last 10,000 items of the playlist. Development-mode Spotify apps can only watch playlists you own or collaborate on.',
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    playlist_id: '3cEYpjA9oz9GiPac4AsH4n',
    added_at: '2026-11-05T10:15:30Z',
    added_by: { id: 'spotify_user_id', type: 'user', uri: 'spotify:user:spotify_user_id' },
    is_local: false,
    item: {
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
    track: {
      id: '4cOdK2wGLETKBW3PvgPWqT',
      name: 'Never Gonna Give You Up',
      uri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
      type: 'track',
    },
  },
  onEnable: async ({ store, auth, propsValue, isRepublish }) => {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const existing = await store.get(CHECKPOINT_KEY, StoreScope.FLOW);
    if (isRepublish && isStored(existing) && existing.playlistId === playlistId) {
      return;
    }
    const client = makeClient({ auth });
    const snapshotId = await client.getPlaylistSnapshotId({ playlistId });
    const items = await fetchWindow({ client, playlistId });
    const checkpoint = spotifyPolling.baseline({ entries: toEntries({ items, playlistId }) });
    await store.put(CHECKPOINT_KEY, toStored({ checkpoint, playlistId, snapshotId }), StoreScope.FLOW);
  },
  onDisable: async () => {
    return;
  },
  run: async ({ store, auth, propsValue }) => {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const stored = await store.get<unknown>(CHECKPOINT_KEY, StoreScope.FLOW);
    const current = isStored(stored) && stored.playlistId === playlistId ? stored : null;
    const client = makeClient({ auth });
    const snapshotId = await client.getPlaylistSnapshotId({ playlistId });
    if (current !== null && snapshotId !== undefined && current.snapshotId === snapshotId) {
      return [];
    }
    const read = await fetchStableWindow({ client, playlistId, snapshotId });
    if (read === null) {
      return [];
    }
    const entries = toEntries({ items: read.items, playlistId });
    if (current === null) {
      await store.put(CHECKPOINT_KEY, toStored({ checkpoint: spotifyPolling.baseline({ entries }), playlistId, snapshotId: read.snapshotId }), StoreScope.FLOW);
      return [];
    }
    const result = spotifyPolling.newSince({ entries, checkpoint: current });
    if (result.emitted.length > 0 || current.snapshotId !== read.snapshotId) {
      await store.put(CHECKPOINT_KEY, toStored({ checkpoint: result.checkpoint, playlistId, snapshotId: read.snapshotId }), StoreScope.FLOW);
    }
    return result.emitted;
  },
  test: async ({ auth, propsValue }) => {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const client = makeClient({ auth });
    const items = await fetchWindow({ client, playlistId });
    return toEntries({ items, playlistId })
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 5)
      .map((entry) => entry.data);
  },
});

type StoredCheckpoint = SpotifyCheckpoint & { playlistId: string; snapshotId?: string };

type NewPlaylistItem = PlaylistItem & { playlist_id: string };

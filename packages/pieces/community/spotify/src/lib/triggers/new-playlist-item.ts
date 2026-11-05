import {
  createTrigger,
  isNil,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyPolling, SpotifyCheckpoint, SpotifyPollEntry } from '../common';
import { spotifyIds } from '../common/ids';
import { PlaylistItem } from '../common/models/playlist';
import { SPOTIFY_PAGE_SIZE, SPOTIFY_PLAYLIST_MAX_ITEMS, SpotifyWebApi } from '../common/client';
import { spotifyOutputSchemas } from '../output-schemas';

function toEntries({ items, playlistId }: { items: PlaylistItem[]; playlistId: string }): SpotifyPollEntry<NewPlaylistItem>[] {
  return items.flatMap((entry) => {
    const ms = spotifyPolling.epochOf(entry.added_at);
    const media = entry.item ?? entry.track ?? null;
    const key = media?.uri ?? `local:${entry.added_at ?? ''}`;
    return ms === undefined ? [] : [{ key, ms, data: { playlist_id: playlistId, ...entry } }];
  });
}

async function fetchWindow({ client, playlistId }: { client: SpotifyWebApi; playlistId: string }): Promise<PlaylistItem[]> {
  const res = await client.getPlaylistItemsWindow({ playlistId, maxItems: SPOTIFY_PLAYLIST_MAX_ITEMS });
  if (res.hasMore) {
    throw new Error(
      `The playlist grew by more than ${SPOTIFY_PAGE_SIZE} items while it was being read; the next poll will retry.`
    );
  }
  return res.items;
}

function isStored(value: unknown): value is StoredCheckpoint {
  return spotifyPolling.isCheckpoint(value) && typeof Reflect.get(value, 'playlistId') === 'string';
}

export default createTrigger({
  name: 'new_playlist_item',
  classification: 'READ',
  displayName: 'New Playlist Item',
  description: 'Triggers when a track or episode is added to a playlist. On playlists over 10,000 items only the last 10,000 are watched, so items inserted near the top are missed. Development-mode Spotify apps can only watch playlists you own or collaborate on.',
  aiMetadata: {
    description: 'Fires once for each track or episode added to the watched playlist since the last poll, emitting the playlist id with the item (added_at, added_by, item). Removals and reorders do not fire, and on playlists over 10,000 items only the last 10,000 positions are watched. Items already in the playlist when the trigger was turned on are skipped.',
  },
  auth: spotifyCommon.authentication,
  type: TriggerStrategy.POLLING,
  outputSchema: spotifyOutputSchemas['newPlaylistItemTrigger'],
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
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
    const items = await fetchWindow({ client, playlistId });
    const checkpoint: StoredCheckpoint = { ...spotifyPolling.baseline({ entries: toEntries({ items, playlistId }) }), playlistId };
    await store.put(CHECKPOINT_KEY, checkpoint, StoreScope.FLOW);
  },
  onDisable: async ({ store, isRepublish }) => {
    if (isRepublish) {
      return;
    }
    await store.delete(CHECKPOINT_KEY, StoreScope.FLOW);
  },
  run: async ({ store, auth, propsValue }) => {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const stored = await store.get<SpotifyCheckpoint>(CHECKPOINT_KEY, StoreScope.FLOW);
    const client = makeClient({ auth });
    const items = await fetchWindow({ client, playlistId });
    const entries = toEntries({ items, playlistId });
    if (isNil(stored) || !isStored(stored) || stored.playlistId !== playlistId) {
      const checkpoint: StoredCheckpoint = { ...spotifyPolling.baseline({ entries }), playlistId };
      await store.put(CHECKPOINT_KEY, checkpoint, StoreScope.FLOW);
      return [];
    }
    const result = spotifyPolling.newSince({ entries, checkpoint: stored });
    if (result.emitted.length > 0) {
      const checkpoint: StoredCheckpoint = { ...result.checkpoint, playlistId };
      await store.put(CHECKPOINT_KEY, checkpoint, StoreScope.FLOW);
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

const CHECKPOINT_KEY = 'new_playlist_item_checkpoint';

type StoredCheckpoint = SpotifyCheckpoint & { playlistId: string };

type NewPlaylistItem = PlaylistItem & { playlist_id: string };

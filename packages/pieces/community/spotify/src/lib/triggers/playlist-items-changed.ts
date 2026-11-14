import {
  createTrigger,
  MarkdownVariant,
  Property,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { spotifyIds } from '../common/ids';
import { PlaylistItem } from '../common/models/playlist';
import { SPOTIFY_PAGE_SIZE, SPOTIFY_PLAYLIST_MAX_ITEMS, SpotifyWebApi } from '../common/client';
import { spotifyOutputSchemas } from '../output-schemas';
import { createHash } from 'crypto';

const HASH_KEY = 'playlist_changed_trigger_hash_v2';
const LEGACY_HASH_KEY = 'playlist_changed_trigger_hash';

function itemKey(entry: PlaylistItem): string {
  const media = entry.item ?? entry.track ?? null;
  return media?.uri ?? `local:${entry.added_at ?? ''}`;
}

function hashOf(items: PlaylistItem[]): string {
  return createHash('md5')
    .update(items.map(itemKey).join(','))
    .digest('hex');
}

async function fetchAll({ client, playlistId }: { client: SpotifyWebApi; playlistId: string }): Promise<PlaylistItem[]> {
  const res = await client.getAllPlaylistItems({
    playlistId,
    maxPages: Math.ceil(SPOTIFY_PLAYLIST_MAX_ITEMS / SPOTIFY_PAGE_SIZE),
  });
  if (res.hasMore) {
    throw new Error(
      `This playlist has more than ${SPOTIFY_PLAYLIST_MAX_ITEMS.toLocaleString('en-US')} items, so Playlist Items Changed cannot read all of it. Watch a smaller playlist.`
    );
  }
  return res.items;
}

function playlistOf(value: unknown): string {
  return spotifyIds.parse({ kind: 'playlist', value, label: 'Playlist' });
}

function isStoredHash(value: unknown): value is StoredHash {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof Reflect.get(value, 'playlistId') === 'string' &&
    typeof Reflect.get(value, 'hash') === 'string'
  );
}

function toStored({ playlistId, items, snapshotId }: { playlistId: string; items: PlaylistItem[]; snapshotId: string | undefined }): StoredHash {
  const hash = hashOf(items);
  return snapshotId === undefined ? { playlistId, hash } : { playlistId, hash, snapshotId };
}

export default createTrigger({
  name: 'playlist_items_changed',
  classification: 'READ',
  displayName: 'Playlist Items Changed',
  description: 'Triggers when items are added to, removed from or moved in a playlist.',
  aiMetadata: {
    description: 'Fires once when the list of items in the watched playlist changes between polls (items added, removed, or reordered), emitting the full current item list. Works on playlists of up to 10,000 items and fails loudly on larger ones. Development-mode Spotify apps can only watch playlists the user owns or collaborates on.',
  },
  auth: spotifyCommon.authentication,
  type: TriggerStrategy.POLLING,
  outputSchema: spotifyOutputSchemas['playlistItemsChangedTrigger'],
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    note: Property.MarkDown({
      value: 'Watches playlists of up to 10,000 items. Development-mode Spotify apps can only watch playlists you own or collaborate on.',
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    total: 1,
    items: [
      {
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
    ],
  },
  onEnable: async ({ store, auth, propsValue, isRepublish }) => {
    const playlistId = playlistOf(propsValue.playlist_id);
    const existing = await store.get(HASH_KEY, StoreScope.FLOW);
    if (isRepublish && isStoredHash(existing) && existing.playlistId === playlistId) {
      return;
    }
    const client = makeClient({ auth });
    const snapshotId = await client.getPlaylistSnapshotId({ playlistId });
    const items = await fetchAll({ client, playlistId });
    await store.put(HASH_KEY, toStored({ playlistId, items, snapshotId }), StoreScope.FLOW);
    await store.delete(LEGACY_HASH_KEY, StoreScope.FLOW);
  },
  onDisable: async () => {
    return;
  },
  run: async ({ store, auth, propsValue }) => {
    const playlistId = playlistOf(propsValue.playlist_id);
    const old = await store.get(HASH_KEY, StoreScope.FLOW);
    const current = isStoredHash(old) && old.playlistId === playlistId ? old : null;
    const client = makeClient({ auth });
    const snapshotId = await client.getPlaylistSnapshotId({ playlistId });
    if (current !== null && snapshotId !== undefined && current.snapshotId === snapshotId) {
      return [];
    }
    const items = await fetchAll({ client, playlistId });
    const stored = toStored({ playlistId, items, snapshotId });
    if (current === null) {
      await store.put(HASH_KEY, stored, StoreScope.FLOW);
      return [];
    }
    if (current.hash !== stored.hash || current.snapshotId !== snapshotId) {
      await store.put(HASH_KEY, stored, StoreScope.FLOW);
    }
    return current.hash === stored.hash ? [] : [{ total: items.length, items }];
  },
  test: async ({ auth, propsValue }) => {
    const client = makeClient({ auth });
    const items = await fetchAll({ client, playlistId: playlistOf(propsValue.playlist_id) });
    return [{ total: items.length, items }];
  },
});

type StoredHash = { playlistId: string; hash: string; snapshotId?: string };

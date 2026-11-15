import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'remove_playlist_items',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove items from playlist',
  description: 'Removes tracks or episodes from the playlist',
  audience: 'both',
  aiMetadata: {
    description: "Removes every occurrence of the given tracks or episodes (Spotify URIs or open.spotify.com links) from a playlist. Lists over 100 items are sent in batches of 100. Pass the playlist's snapshot id to remove only from that version. Idempotent in effect: removing items already absent leaves the same playlist contents.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playlistRemove'],
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    items: Property.Array({
      displayName: 'Items',
      description: "URI's of the items to remove",
      required: true,
    }),
    snapshot_id: Property.ShortText({
      displayName: 'Snapshot ID',
      description: 'Optional snapshot ID (from Get Playlist Info or an earlier write).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const uris = spotifyIds.parseUriList({ value: propsValue.items, kinds: ['track', 'episode'], label: 'Items', allowLocal: true });
    if (uris.length === 0) {
      throw new Error('Items is empty: give at least one track or episode URI to remove.');
    }
    const client = makeClient({ auth });
    const res = await client.removeItemsFromPlaylist({
      playlistId,
      uris,
      snapshotId: spotifyValidate.optionalText(propsValue.snapshot_id),
    });
    return { playlist_id: playlistId, snapshot_id: res.snapshot_id, removed: res.removed };
  },
});

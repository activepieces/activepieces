import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'add_playlist_items',
  classification: 'WRITE',
  auth: spotifyCommon.authentication,
  displayName: 'Add Items to Playlist',
  description: 'Adds tracks or episodes to the playlist',
  audience: 'both',
  aiMetadata: {
    description: "Adds tracks or episodes (Spotify URIs or open.spotify.com links) to a playlist, optionally at a 0-based position. Lists over 100 items are sent in batches of 100. Use it to append items; to overwrite the whole playlist use Replace Playlist Items. Not idempotent: repeating the call adds the items again, creating duplicates.",
    idempotent: false,
  },
  outputSchema: spotifyOutputSchemas['playlistAdd'],
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    items: Property.Array({
      displayName: 'Items',
      description: 'Track or episode URIs or links.',
      required: true,
    }),
    position: Property.Number({
      displayName: 'Position',
      description: 'Where to insert, counting from 0; empty adds to the end.',
      required: false,
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const uris = spotifyIds.parseUriList({ value: propsValue.items, kinds: ['track', 'episode'], label: 'Items' });
    if (uris.length === 0) {
      throw new Error('Items is empty: give at least one track or episode URI.');
    }
    const position = spotifyValidate.optionalInteger({ value: propsValue.position, field: 'Position', min: 0 });
    const client = makeClient({ auth });
    const res = await client.addItemsToPlaylist({ playlistId, uris, position });
    return { playlist_id: playlistId, snapshot_id: res.snapshot_id, added: res.added };
  },
});

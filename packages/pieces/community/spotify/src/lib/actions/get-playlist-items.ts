import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'get_playlist_items',
  displayName: 'Get Playlist Items',
  description: 'Retrieves the list of items in the playlist',
  audience: 'both',
  aiMetadata: {
    description: 'Lists the tracks/episodes contained in a playlist, identified by its playlist id. By default returns one paged page (limit/offset); enable the All option to auto-page through and return every item in one call. Use it to read a playlist\'s contents. Read-only and repeatable.',
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
    }),
    all: Property.Checkbox({
      displayName: 'All',
      description: 'Fetches all items in a single request',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    if (propsValue.all) {
      const items = await client.getAllPlaylistItems(
        propsValue.playlist_id as string
      );
      return { total: items.length, items };
    }
    return await client.getPlaylistItems(propsValue.playlist_id as string, {
      limit: propsValue.limit,
      offset: propsValue.offset,
    });
  },
});

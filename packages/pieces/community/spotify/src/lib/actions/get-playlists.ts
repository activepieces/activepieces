import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'get_playlists',
  displayName: 'Get Playlists',
  description: 'Retrieves the list of playlists that you created or followed',
  audience: 'both',
  aiMetadata: {
    description: "Lists the current user's own and followed playlists. Use it to discover a playlist's id before reading, updating, or modifying it. By default returns one paged page (limit/offset); enable the All option to auto-page through and return every playlist in one call. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  props: {
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
      description: 'Fetches all playlists in a single request',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    if (propsValue.all) {
      const items = await client.getAllCurrentUserPlaylists();
      return { total: items.length, items };
    }
    return await client.getCurrentUserPlaylists({
      limit: propsValue.limit,
      offset: propsValue.offset,
    });
  },
});

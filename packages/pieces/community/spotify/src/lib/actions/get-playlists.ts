import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'get_playlists',
  displayName: 'Get Playlists',
  description: 'Retrieves the list of playlists that you created or followed',
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

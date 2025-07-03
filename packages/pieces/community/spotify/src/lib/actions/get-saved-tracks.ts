import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'get_saved_tracks',
  displayName: 'Get Saved Tracks',
  description: 'Retrieves the list of saved tracks for the current user',
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
      description: 'Fetches all items in a single request',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    if (propsValue.all) {
      const items = await client.getAllSavedTracks();
      return { total: items.length, items };
    }
    return await client.getSavedTracks({
      limit: propsValue.limit,
      offset: propsValue.offset,
    });
  },
});

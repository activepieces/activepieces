import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'remove_library_items',
  auth: spotifyCommon.authentication,
  displayName: 'Remove items from your library',
  description: 'Remove tracks, episodes, albums, shows, audiobooks, users or playlists from your library',
  props: {
    items: Property.Array({
      displayName: 'Items',
      description: "URI's of the items to add",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({
      auth,
    });
    await client.removeSavedItems({
      uris: propsValue.items as string[]
    });
  },
});

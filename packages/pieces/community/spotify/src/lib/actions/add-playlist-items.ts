import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'add_playlist_items',
  auth: spotifyCommon.authentication,
  displayName: 'Add items to playlist',
  description: 'Adds tracks or episodes to the playlist',
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    items: Property.Array({
      displayName: 'Items',
      description: "URI's of the items to add",
      required: true,
    }),
    position: Property.Number({
      displayName: 'Position',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({
      auth,
    });
    await client.addItemsToPlaylist(propsValue.playlist_id as string, {
      uris: propsValue.items as string[],
      position: propsValue.position,
    });
  },
});

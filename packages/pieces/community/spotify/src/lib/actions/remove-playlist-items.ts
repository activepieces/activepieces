import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'remove_playlist_items',
  displayName: 'Remove items from playlist',
  description: 'Removes tracks or episodes from the playlist',
  auth: spotifyCommon.authentication,
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    items: Property.Array({
      displayName: 'Items',
      description: "URI's of the items to remove",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    await client.removeItemsFromPlaylist(propsValue.playlist_id as string, {
      tracks: propsValue.items.map((uri) => ({ uri: uri as string })),
    });
  },
});

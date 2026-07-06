import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'remove_library_items',
  auth: spotifyCommon.authentication,
  displayName: 'Remove items from your library',
  description: 'Remove tracks, episodes, albums, shows, audiobooks, users or playlists from your library',
  audience: 'both',
  aiMetadata: { description: 'Removes one or more items (tracks, episodes, albums, shows, audiobooks, or playlists) from the connected Spotify library by their URIs. Use to unsave or unfollow content. Idempotent: removing an item that is not saved leaves the library unchanged, converging to the same state.', idempotent: true },
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

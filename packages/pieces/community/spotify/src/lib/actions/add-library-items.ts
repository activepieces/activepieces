import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'add_library_items',
  auth: spotifyCommon.authentication,
  displayName: 'Add items to library',
  description: 'Add tracks, episodes, albums, shows, audiobooks, users or playlists to your library',
  audience: 'both',
  aiMetadata: { description: 'Saves one or more items (tracks, episodes, albums, shows, audiobooks, or playlists) to the connected Spotify library by their URIs. Use to bookmark or follow content for the authenticated account. Idempotent: re-adding an already-saved item leaves the library unchanged.', idempotent: true },
  props: {
    items: Property.Array({
      displayName: 'Items',
      description: "URI's of the items to add",
      required: true,
    })
  },
  async run({ auth, propsValue }) {
    const client = makeClient({
      auth,
    });
    await client.addSavedItems({
      uris: propsValue.items as string[],
    });
  },
});

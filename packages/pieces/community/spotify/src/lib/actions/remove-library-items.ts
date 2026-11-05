import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { SPOTIFY_KINDS, spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'remove_library_items',
  classification: 'DESTRUCTIVE',
  auth: spotifyCommon.authentication,
  displayName: 'Remove items from your library',
  description: 'Remove tracks, episodes, albums, shows, audiobooks, artists, users or playlists from your library',
  audience: 'both',
  aiMetadata: { description: 'Removes tracks, albums, episodes, shows or audiobooks from the connected Spotify library, and unfollows artists, users or playlists, by their Spotify URIs or open.spotify.com links (sent in batches of 40). Use to unsave or unfollow content. Idempotent: removing an item that is not saved leaves the library unchanged.', idempotent: true },
  outputSchema: spotifyOutputSchemas['libraryWrite'],
  props: {
    items: Property.Array({
      displayName: 'Items',
      description: "URI's of the items to remove (for example spotify:track:…, spotify:album:…, spotify:playlist:…)",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const uris = spotifyIds.parseUriList({ value: propsValue.items, kinds: SPOTIFY_KINDS, label: 'Items' });
    if (uris.length === 0) {
      throw new Error('Items is empty: give at least one Spotify URI.');
    }
    const client = makeClient({ auth });
    await client.removeSavedItems({ uris });
    return { uris, count: uris.length };
  },
});

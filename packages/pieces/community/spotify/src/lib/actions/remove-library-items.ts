import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { SPOTIFY_LIBRARY_WRITE_KINDS, spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'remove_library_items',
  classification: 'DESTRUCTIVE',
  auth: spotifyCommon.authentication,
  displayName: 'Remove Items from Library',
  description: 'Removes saved items, or unfollows users and playlists.',
  audience: 'both',
  aiMetadata: { description: 'Removes tracks, albums, episodes, shows or audiobooks from the connected Spotify library, and unfollows users or playlists, by their Spotify URIs or open.spotify.com links (sent in batches of 40). Artist URIs are rejected because the library endpoints do not accept them. Use to unsave or unfollow content. Idempotent: removing an item that is not saved leaves the library unchanged.', idempotent: true },
  outputSchema: spotifyOutputSchemas['libraryWrite'],
  props: {
    items: Property.Array({
      displayName: 'Items',
      description: 'Spotify URIs or open.spotify.com links, one per item.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const uris = spotifyIds.parseUriList({ value: propsValue.items, kinds: SPOTIFY_LIBRARY_WRITE_KINDS, label: 'Items' });
    if (uris.length === 0) {
      throw new Error('Items is empty: give at least one Spotify URI.');
    }
    const client = makeClient({ auth });
    await client.removeSavedItems({ uris });
    return { uris, count: uris.length };
  },
});

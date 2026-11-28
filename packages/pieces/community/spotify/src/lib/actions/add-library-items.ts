import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { SPOTIFY_LIBRARY_WRITE_KINDS, spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'add_library_items',
  classification: 'WRITE',
  auth: spotifyCommon.authentication,
  displayName: 'Add items to library',
  description: 'Add tracks, episodes, albums, shows, audiobooks, users or playlists to your library',
  audience: 'both',
  aiMetadata: { description: 'Saves tracks, albums, episodes, shows or audiobooks to the connected Spotify library, and follows users or playlists, by their Spotify URIs or open.spotify.com links (sent in batches of 40). Artist URIs are rejected because the library endpoints do not accept them. Use to bookmark or follow content for the authenticated account. Idempotent: re-adding an already-saved item leaves the library unchanged.', idempotent: true },
  outputSchema: spotifyOutputSchemas['libraryWrite'],
  props: {
    items: Property.Array({
      displayName: 'Items',
      description: 'Spotify URIs or links, e.g. spotify:track:… or spotify:playlist:…',
      required: true,
    })
  },
  async run({ auth, propsValue }) {
    const uris = spotifyIds.parseUriList({ value: propsValue.items, kinds: SPOTIFY_LIBRARY_WRITE_KINDS, label: 'Items' });
    if (uris.length === 0) {
      throw new Error('Items is empty: give at least one Spotify URI.');
    }
    const client = makeClient({ auth });
    await client.addSavedItems({ uris });
    return { uris, count: uris.length };
  },
});

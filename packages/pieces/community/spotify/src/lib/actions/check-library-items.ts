import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { SPOTIFY_KINDS, spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'check_library_items',
  classification: 'READ',
  auth: spotifyCommon.authentication,
  displayName: 'Check Library Items',
  description: 'Checks whether items are saved or followed.',
  audience: 'both',
  aiMetadata: {
    description: 'Checks, for each Spotify URI or open.spotify.com link, whether it is saved in (or followed by) the connected library; returns one {uri, saved} result per input. Use it before adding or removing to avoid unnecessary writes. Read-only and repeatable.',
    idempotent: true,
  },
  outputSchema: spotifyOutputSchemas['libraryCheck'],
  props: {
    items: Property.Array({
      displayName: 'Items',
      description: 'Spotify URIs or open.spotify.com links, one per item.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const uris = spotifyIds.parseUriList({ value: propsValue.items, kinds: SPOTIFY_KINDS, label: 'Items' });
    if (uris.length === 0) {
      throw new Error('Items is empty: give at least one Spotify URI.');
    }
    const client = makeClient({ auth });
    const flags = await client.checkSavedItems({ uris });
    return { results: uris.map((uri, index) => ({ uri, saved: flags[index] === true })) };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_artist',
  classification: 'READ',
  displayName: 'Get Artist',
  description: 'Gets an artist by ID, URI or link',
  audience: 'both',
  aiMetadata: {
    description: "Fetches one Spotify artist (name, genres, images, link) by its ID, spotify:artist: URI or open.spotify.com link. For their releases use Get Artist Albums. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['artist'],
  props: {
    id: spotifyCommon.catalogId({ kind: 'artist', displayName: 'Artist ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = spotifyIds.parse({ kind: 'artist', value: propsValue.id, label: 'Artist ID' });
    const client = makeClient({ auth });
    return client.getArtist({ id });
  },
});

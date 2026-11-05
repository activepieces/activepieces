import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_album',
  classification: 'READ',
  displayName: 'Get Album',
  description: 'Gets an album and its first tracks by its ID, URI or link',
  audience: 'both',
  aiMetadata: {
    description: "Fetches one Spotify album (name, artists, release date, images, first page of tracks) by its ID, spotify:album: URI or open.spotify.com link. For every track of a long album use Get Album Tracks. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['album'],
  props: {
    id: spotifyCommon.catalogId({ kind: 'album', displayName: 'Album ID', required: true }),
    market: spotifyCommon.market(),
  },
  async run({ auth, propsValue }) {
    const id = spotifyIds.parse({ kind: 'album', value: propsValue.id, label: 'Album ID' });
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    return client.getAlbum({ id, market });
  },
});

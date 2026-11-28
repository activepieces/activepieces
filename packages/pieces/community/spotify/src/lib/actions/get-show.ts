import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_show',
  classification: 'READ',
  displayName: 'Get Show',
  description: 'Gets a podcast show by its ID, URI or link',
  audience: 'both',
  aiMetadata: {
    description: "Fetches one Spotify podcast show (name, description, episode count, images) by its ID, spotify:show: URI or open.spotify.com link. For its episodes use Get Show Episodes. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['show'],
  props: {
    id: spotifyCommon.catalogId({ kind: 'show', displayName: 'Show ID', required: true }),
    market: spotifyCommon.market(),
  },
  async run({ auth, propsValue }) {
    const id = spotifyIds.parse({ kind: 'show', value: propsValue.id, label: 'Show ID' });
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    return client.getShow({ id, market });
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_episode',
  classification: 'READ',
  displayName: 'Get Episode',
  description: 'Gets a podcast episode by its ID, URI or link',
  audience: 'both',
  aiMetadata: {
    description: "Fetches one Spotify podcast episode (name, description, duration, release date, show) by its ID, spotify:episode: URI or open.spotify.com link. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['episode'],
  props: {
    id: spotifyCommon.catalogId({ kind: 'episode', displayName: 'Episode ID', required: true }),
    market: spotifyCommon.market(),
  },
  async run({ auth, propsValue }) {
    const id = spotifyIds.parse({ kind: 'episode', value: propsValue.id, label: 'Episode ID' });
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    return client.getEpisode({ id, market });
  },
});

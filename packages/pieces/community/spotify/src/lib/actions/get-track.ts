import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_track',
  classification: 'READ',
  displayName: 'Get Track',
  description: 'Gets a track by its ID, URI or link',
  audience: 'both',
  aiMetadata: {
    description: "Fetches one Spotify track (name, artists, album, duration, explicit flag, links) by its ID, spotify:track: URI or open.spotify.com link. Use it after Search or when a flow already has a track reference. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['track'],
  props: {
    id: spotifyCommon.catalogId({ kind: 'track', displayName: 'Track ID', required: true }),
    market: spotifyCommon.market(),
  },
  async run({ auth, propsValue }) {
    const id = spotifyIds.parse({ kind: 'track', value: propsValue.id, label: 'Track ID' });
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    return client.getTrack({ id, market });
  },
});

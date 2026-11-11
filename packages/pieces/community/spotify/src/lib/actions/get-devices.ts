import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_devices',
  classification: 'READ',
  displayName: 'Get Devices',
  description: 'Lists the Spotify devices available for playback',
  audience: 'both',
  aiMetadata: {
    description: 'Lists the Spotify Connect devices the user has open (id, name, type, active flag, volume). Use it to find a device id for Play / Resume, Transfer Playback and the other player actions. A device only appears while Spotify is open on it. Read-only and repeatable.',
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['devices'],
  props: {},
  async run({ auth }) {
    const client = makeClient({ auth });
    const res = await client.getDevices();
    return { devices: Array.isArray(res.devices) ? res.devices : [] };
  },
});

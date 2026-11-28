import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'pause',
  classification: 'WRITE',
  displayName: 'Pause',
  description: 'Pauses the playback',
  audience: 'both',
  aiMetadata: {
    description: 'Pauses playback on the active (or a specified) Spotify device. Use it to stop the currently playing track; needs Spotify Premium and an active device. Not idempotent: pausing a player that is already paused fails with a 403 "Restriction violated" error, so check Get Playback State before retrying.',
    idempotent: false,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playerResult'],
  props: {
    device_id: spotifyCommon.device_id(false),
  },
  async run({ auth, propsValue }) {
    const deviceId = spotifyValidate.deviceId(propsValue.device_id);
    const client = makeClient({ auth });
    await client.pause({ device_id: deviceId });
    return { success: true, device_id: deviceId ?? null };
  },
});

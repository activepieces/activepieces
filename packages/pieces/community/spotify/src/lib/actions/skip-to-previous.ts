import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'skip_to_previous',
  classification: 'WRITE',
  displayName: 'Skip to Previous',
  description: 'Skips to the previous item',
  audience: 'both',
  aiMetadata: {
    description: "Skips playback to the previous item on the active or a given Spotify device. Needs Spotify Premium and an open Spotify app. Not idempotent: each call skips once more.",
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
    await client.skipToPrevious({ device_id: deviceId });
    return { success: true, device_id: deviceId ?? null };
  },
});

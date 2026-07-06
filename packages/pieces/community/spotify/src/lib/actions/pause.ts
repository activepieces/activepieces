import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'pause',
  displayName: 'Pause',
  description: 'Pauses the playback',
  audience: 'both',
  aiMetadata: {
    description: 'Pauses playback on the active (or a specified) Spotify device. Use it to stop the currently playing track; requires an active device. Idempotent in effect: pausing an already-paused player leaves the same paused state with no further side effect.',
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  props: {
    device_id: spotifyCommon.device_id(false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    const res = await client.pause({
      device_id: propsValue.device_id,
    });
    return res;
  },
});

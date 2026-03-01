import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'pause',
  displayName: 'Pause',
  description: 'Pauses the playback',
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

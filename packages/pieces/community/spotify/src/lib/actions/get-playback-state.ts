import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'get_playback_state',
  displayName: 'Get Playback State',
  description: 'Retrieves the current playback state of the player',
  auth: spotifyCommon.authentication,
  props: {},
  async run({ auth }) {
    const client = makeClient({ auth });
    const res = await client.getPlaybackState();
    return res;
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'get_playback_state',
  displayName: 'Get Playback State',
  description: 'Retrieves the current playback state of the player',
  audience: 'both',
  aiMetadata: {
    description: "Reads the current user's active playback state, including the playing/paused status, current track, device, volume, and progress. Use it to inspect what is playing before issuing playback commands. Read-only and repeatable; returns empty when no device is active.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  props: {},
  async run({ auth }) {
    const client = makeClient({ auth });
    const res = await client.getPlaybackState();
    return res;
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_playback_state',
  classification: 'READ',
  displayName: 'Get Playback State',
  description: 'Retrieves the current playback state of the player',
  audience: 'both',
  aiMetadata: {
    description: "Reads the current user's playback state: whether something is playing, the current track or episode, progress, device, volume, shuffle and repeat. Use it to answer \"what is playing\" or to inspect the device before issuing playback commands. When nothing is playing it returns is_playing false with device and item null. Read-only and repeatable; works without Premium.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playback'],
  props: {
    market: spotifyCommon.market({ advanced: false }),
  },
  async run({ auth, propsValue }) {
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    const res = await client.getPlaybackState({ market });
    return res ?? { is_playing: false, device: null, item: null };
  },
});

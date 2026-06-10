import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'set_volume',
  displayName: 'Set Volume',
  auth: spotifyCommon.authentication,
  description: 'Sets the volume of the player',
  audience: 'both',
  aiMetadata: {
    description: 'Sets the playback volume on the active (or a specified) Spotify device to an absolute level from 0 to 100. Use it to adjust loudness; requires an active device. Idempotent: setting the same level repeatedly yields the same volume with no extra side effect.',
    idempotent: true,
  },
  props: {
    volume: Property.Number({
      displayName: 'Volume',
      description: 'Volume from 0 to 100',
      required: true,
    }),
    device_id: spotifyCommon.device_id(false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    const res = await client.setVolume({
      volume_percent: propsValue.volume,
      device_id: propsValue.device_id,
    });
    return res;
  },
});

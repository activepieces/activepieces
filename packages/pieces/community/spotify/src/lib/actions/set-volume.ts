import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'set_volume',
  displayName: 'Set Volume',
  auth: spotifyCommon.authentication,
  description: 'Sets the volume of the player',
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

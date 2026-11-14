import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'set_shuffle',
  classification: 'WRITE',
  displayName: 'Set Shuffle',
  description: 'Turns shuffle on or off',
  audience: 'both',
  aiMetadata: {
    description: "Turns shuffle 'on' or 'off' for the user's playback. Needs Spotify Premium and an active device. Idempotent: the same value gives the same state.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playerState'],
  props: {
    state: Property.StaticDropdown<string>({
      displayName: 'Shuffle',
      required: true,
      display: 'cards',
      defaultValue: 'on',
      options: {
        options: [
          { label: 'On', value: 'on', description: 'Play in random order' },
          { label: 'Off', value: 'off', description: 'Play in order' },
        ],
      },
    }),
    device_id: spotifyCommon.device_id(false),
  },
  async run({ auth, propsValue }) {
    const state = propsValue.state;
    if (state !== 'on' && state !== 'off') {
      throw new Error('Shuffle must be on or off.');
    }
    const deviceId = spotifyValidate.deviceId(propsValue.device_id);
    const client = makeClient({ auth });
    await client.setShuffle({ state: state === 'on', device_id: deviceId });
    return { success: true, state, device_id: deviceId ?? null };
  },
});

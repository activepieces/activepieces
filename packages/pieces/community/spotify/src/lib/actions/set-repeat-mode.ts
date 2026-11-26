import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'set_repeat_mode',
  classification: 'WRITE',
  displayName: 'Set Repeat Mode',
  description: 'Repeats the current track, the current context, or turns repeat off',
  audience: 'both',
  aiMetadata: {
    description: "Sets the repeat mode of the player: 'track' repeats the current item, 'context' repeats the album or playlist, 'off' disables repeat. Needs Spotify Premium and an active device. Idempotent: the same mode gives the same state.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playerState'],
  props: {
    state: Property.StaticDropdown<string>({
      displayName: 'Repeat Mode',
      required: true,
      display: 'cards',
      defaultValue: 'context',
      options: {
        options: [
          { label: 'Track', value: 'track', description: 'Repeat the current track' },
          { label: 'Album or Playlist', value: 'context', description: 'Repeat what is playing' },
          { label: 'Off', value: 'off', description: 'Stop repeating' },
        ],
      },
    }),
    device_id: spotifyCommon.device_id(false),
  },
  async run({ auth, propsValue }) {
    const state = propsValue.state;
    if (state !== 'track' && state !== 'context' && state !== 'off') {
      throw new Error('Repeat Mode must be track, context or off.');
    }
    const deviceId = spotifyValidate.deviceId(propsValue.device_id);
    const client = makeClient({ auth });
    await client.setRepeatMode({ state, device_id: deviceId });
    return { success: true, state, device_id: deviceId ?? null };
  },
});

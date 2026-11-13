import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'transfer_playback',
  classification: 'WRITE',
  displayName: 'Transfer Playback',
  description: 'Moves playback to another device',
  audience: 'both',
  aiMetadata: {
    description: "Moves the user's playback to the given device (get ids from Get Devices). Pass play 'yes' to start playing there, 'no' to keep it paused, or omit it to keep the current play state. Needs Spotify Premium. Idempotent: transferring to the device that already plays changes nothing.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['transferPlayback'],
  props: {
    device_id: spotifyCommon.device_id(true),
    play: Property.StaticDropdown<string>({
      displayName: 'Start Playing',
      description: 'Yes starts playback there; otherwise the current state is kept.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const deviceId = spotifyValidate.deviceId(propsValue.device_id);
    if (deviceId === undefined) {
      throw new Error('Device is required.');
    }
    const play = spotifyValidate.yesNo({ value: propsValue.play, field: 'Start Playing' });
    const client = makeClient({ auth });
    await client.transferPlayback({ device_id: deviceId, play });
    return { success: true, device_id: deviceId, play: play ?? null };
  },
});

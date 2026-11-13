import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'set_volume',
  classification: 'WRITE',
  displayName: 'Set Volume',
  auth: spotifyCommon.authentication,
  description: 'Sets the volume of the player',
  audience: 'both',
  aiMetadata: {
    description: 'Sets the playback volume on the active (or a specified) Spotify device to an absolute level from 0 to 100. Use it to adjust loudness; needs Spotify Premium and a device that supports volume control. Idempotent: setting the same level repeatedly yields the same volume.',
    idempotent: true,
  },
  outputSchema: spotifyOutputSchemas['setVolume'],
  props: {
    volume: Property.Number({
      displayName: 'Volume',
      description: 'Volume from 0 to 100',
      required: true,
    }),
    device_id: spotifyCommon.device_id(false),
  },
  async run({ auth, propsValue }) {
    const volume = spotifyValidate.requiredInteger({ value: propsValue.volume, field: 'Volume', min: 0, max: 100 });
    const deviceId = spotifyValidate.deviceId(propsValue.device_id);
    const client = makeClient({ auth });
    await client.setVolume({ volume_percent: volume, device_id: deviceId });
    return { success: true, volume_percent: volume, device_id: deviceId ?? null };
  },
});

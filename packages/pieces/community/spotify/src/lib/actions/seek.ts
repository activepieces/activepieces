import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'seek',
  classification: 'WRITE',
  displayName: 'Seek to Position',
  description: 'Jumps to a position in the currently playing item',
  audience: 'both',
  aiMetadata: {
    description: 'Moves playback of the current track or episode to the given position in milliseconds (past the end skips to the next item). Needs Spotify Premium and an active device. Not idempotent: repeating a position past the end can skip another item.',
    idempotent: false,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['seek'],
  props: {
    position_ms: Property.Number({
      displayName: 'Position (ms)',
      description: 'Position in milliseconds, for example 90000 for 1:30.',
      required: true,
    }),
    device_id: spotifyCommon.device_id(false),
  },
  async run({ auth, propsValue }) {
    const positionMs = spotifyValidate.requiredInteger({ value: propsValue.position_ms, field: 'Position (ms)', min: 0 });
    const deviceId = spotifyValidate.deviceId(propsValue.device_id);
    const client = makeClient({ auth });
    await client.seek({ position_ms: positionMs, device_id: deviceId });
    return { success: true, position_ms: positionMs, device_id: deviceId ?? null };
  },
});

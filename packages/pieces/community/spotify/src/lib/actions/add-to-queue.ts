import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'add_to_queue',
  classification: 'WRITE',
  displayName: 'Add to Queue',
  description: 'Adds a track or episode to the end of the playback queue',
  audience: 'both',
  aiMetadata: {
    description: "Adds one track or episode (Spotify URI or open.spotify.com link) to the end of the user's playback queue on the active or a given device. Needs Spotify Premium and an open Spotify app. Not idempotent: each call queues the item again.",
    idempotent: false,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['addToQueue'],
  props: {
    uri: Property.ShortText({
      displayName: 'Track or Episode',
      description: 'Track or episode URI (spotify:track:…) or open.spotify.com link',
      required: true,
    }),
    device_id: spotifyCommon.device_id(false),
  },
  async run({ auth, propsValue }) {
    const uri = spotifyIds.parseUri({ value: propsValue.uri, kinds: ['track', 'episode'], label: 'Track or Episode' });
    const deviceId = spotifyValidate.deviceId(propsValue.device_id);
    const client = makeClient({ auth });
    await client.addToQueue({ uri, device_id: deviceId });
    return { success: true, uri, device_id: deviceId ?? null };
  },
});

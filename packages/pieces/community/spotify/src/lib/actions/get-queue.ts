import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_queue',
  classification: 'READ',
  displayName: 'Get Queue',
  description: 'Gets the currently playing item and the playback queue',
  audience: 'both',
  aiMetadata: {
    description: "Returns the item that is playing now and the upcoming items in the user's playback queue. Use it to see what will play next; use Add to Queue to append. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['queue'],
  props: {},
  async run({ auth }) {
    const client = makeClient({ auth });
    const res = await client.getQueue();
    return {
      currently_playing: res.currently_playing ?? null,
      queue: Array.isArray(res.queue) ? res.queue : [],
    };
  },
});

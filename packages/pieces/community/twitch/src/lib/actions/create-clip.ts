import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const createClip = createAction({
  auth: twitchAuth,
  name: 'create_clip',
  displayName: 'Create Clip',
  description: 'Create a clip from a live stream.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a clip of the last seconds of a live Twitch stream. Requires clips:edit; the broadcaster (default: the connected account) must be live. Set has_delay to "yes" to add a short delay so the clip matches what viewers saw. Twitch processes the clip asynchronously and responds 202: returns id and edit_url; use Get Clips with the id after about 15 seconds to confirm it exists. Not idempotent: each call creates a clip.',
    idempotent: false,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    has_delay: twitchCommon.props.yesNo({ displayName: 'Add Delay', description: 'Add a short delay before capturing, to match what viewers saw.' }),
  },
  outputSchema: {
    fields: [
      { key: 'id', label: 'Clip ID' },
      { key: 'edit_url', label: 'Edit URL', format: 'url' },
    ],
  },
  async run({ auth, propsValue }) {
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const hasDelay = twitchCommon.triState(propsValue.has_delay);
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.POST,
      path: '/clips',
      query: {
        broadcaster_id: broadcasterId,
        has_delay: hasDelay === undefined ? undefined : String(hasDelay),
      },
    });
    return twitchCommon.firstItem({ page: response.body, label: 'clip' });
  },
});

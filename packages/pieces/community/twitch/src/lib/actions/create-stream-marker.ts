import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const createStreamMarker = createAction({
  auth: twitchAuth,
  name: 'create_stream_marker',
  displayName: 'Create Stream Marker',
  description: 'Add a marker at the current position of a live stream.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Add a marker (bookmark) at the current point of a live Twitch stream so it can be found later in the VOD. Requires channel:manage:broadcast; the channel (default: the connected account, or one it is editor of) must be live with VODs enabled and not a rerun. description is optional, max 140 characters. Returns id, created_at, description and position_seconds. Not idempotent: each call adds a marker.',
    idempotent: false,
  },
  props: {
    user_id: Property.ShortText({
      displayName: 'Channel User ID',
      description: 'Numeric ID of the live channel. Leave empty for your own channel.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Up to 140 characters.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'id', label: 'Marker ID' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'description', label: 'Description' },
      { key: 'position_seconds', label: 'Position (seconds)', format: 'number' },
    ],
  },
  async run({ auth, propsValue }) {
    const description = twitchCommon.optionalText(propsValue.description);
    if (description !== undefined) {
      twitchCommon.assertTextLength({ value: description, max: 140, label: 'Description' });
    }
    const userId = await twitchCommon.resolveUserId({ auth, value: propsValue.user_id });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.POST,
      path: '/streams/markers',
      body: twitchCommon.compact({ user_id: userId, description }),
    });
    return twitchCommon.firstItem({ page: response.body, label: 'marker' });
  },
});

import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const removeRecentCustomStatusAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_remove_recent_custom_status',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Remove Recent Custom Status',
  description: 'Removes an entry from the connected user\'s recent custom statuses.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one entry from the connected user\'s recent custom statuses list. All four fields must match the entry exactly; the list is the "recentCustomStatuses" JSON in props from Get User with "me". Only works for the connected account.',
    idempotent: false,
  },
  props: {
    emoji: Property.ShortText({
      displayName: 'Emoji',
      description: 'The entry\'s emoji, e.g. "calendar".',
      required: true,
    }),
    text: Property.ShortText({
      displayName: 'Text',
      description: 'The entry\'s text.',
      required: true,
    }),
    duration: Property.ShortText({
      displayName: 'Duration',
      description: 'The entry\'s duration, e.g. "one_hour" or "date_and_time".',
      required: true,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expires At',
      description: 'The entry\'s expires_at, exactly as stored (ISO 8601).',
      required: true,
    }),
  },
  async run(context) {
    const { emoji, text, duration, expiresAt } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/users/me/status/custom/recent/delete',
      body: { emoji, text, duration, expires_at: expiresAt },
    });
  },
});

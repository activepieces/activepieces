import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const setPostReminderAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_set_post_reminder',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Set Post Reminder',
  description: 'Sets a reminder about a post for a user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Schedules a reminder about a post; at Target Time the system bot messages the user about it. Pass "me" for the connected account. Setting it again for the same post replaces the earlier time.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    postId: mattermostAiProps.postId({ required: true }),
    targetTime: Property.Number({
      displayName: 'Target Time',
      description: 'When to send the reminder, in seconds since epoch (not milliseconds).',
      required: true,
    }),
  },
  async run(context) {
    const { userId, postId, targetTime } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/users/${encodeURIComponent(userId)}/posts/${encodeURIComponent(postId)}/reminder`,
      body: { target_time: targetTime },
    });
  },
});

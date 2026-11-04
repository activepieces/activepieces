import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetChannelUnreadOutputSchema } from '../../../output-schemas';

export const getChannelUnreadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_channel_unread',
  outputSchema: mattermostGetChannelUnreadOutputSchema,
  displayName: 'Get Channel Unread',
  description: 'Gets a user\'s unread message and mention counts in a channel.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many unread messages and mentions a user has in one channel; pass "me" for the connected account. Clear them with Mark Channels Read.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    channelId: mattermostAiProps.channelId({ required: true }),
  },
  async run(context) {
    const { userId, channelId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/channels/${encodeURIComponent(channelId)}/unread`,
    });
  },
});

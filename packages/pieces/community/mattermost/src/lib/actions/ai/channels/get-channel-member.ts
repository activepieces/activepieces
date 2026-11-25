import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostAddChannelMemberOutputSchema } from '../../../output-schemas';

export const getChannelMemberAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_channel_member',
  outputSchema: mattermostAddChannelMemberOutputSchema,
  displayName: 'Get Channel Member',
  description: 'Gets one user\'s membership in a channel.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a user\'s membership in a channel: channel roles, notification settings, and message counts; pass "me" for the connected account. Fails if the user is not a member.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    const { channelId, userId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/channels/${encodeURIComponent(channelId)}/members/${encodeURIComponent(userId)}`,
    });
  },
});

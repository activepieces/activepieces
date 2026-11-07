import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostApi } from '../../../common/api';
import { mattermostClient } from '../../../common/client';
import { mattermostAddChannelMemberOutputSchema } from '../../../output-schemas';

export const addChannelMemberAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_add_channel_member',
  outputSchema: mattermostAddChannelMemberOutputSchema,
  displayName: 'Add Channel Member',
  description: 'Adds a user to a channel.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds one user to a public or private channel; pass "me" to join a public channel as the connected user. The user must already be on the channel\'s team. Adding an existing member keeps the membership as it is.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    const { channelId, userId } = context.propsValue;
    const memberId = userId === 'me' ? (await mattermostApi.getMe({ auth: context.auth })).id : userId;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/channels/${encodeURIComponent(channelId)}/members`,
      body: { user_id: memberId },
    });
  },
});

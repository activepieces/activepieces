import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const removeChannelMemberAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_remove_channel_member',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Remove Channel Member',
  description: 'Removes a user from a channel.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes one user from a public or private channel; pass "me" to leave it as the connected user. Add Channel Member reverses it. Members cannot be removed from direct or group messages or the default channel.',
    idempotent: false,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    const { channelId, userId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/channels/${encodeURIComponent(channelId)}/members/${encodeURIComponent(userId)}`,
    });
  },
});

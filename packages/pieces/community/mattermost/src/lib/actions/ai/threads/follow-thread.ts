import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const followThreadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_follow_thread',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Follow Thread',
  description: 'Starts following a thread for a user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a user follow a thread so its replies show in their threads list and notify them; pass "me" for the connected account. Following an already followed thread changes nothing. Undo with Unfollow Thread.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
    threadId: Property.ShortText({
      displayName: 'Thread ID',
      description: 'ID (26 characters) of the thread\'s root post. Use List Followed Threads or Get Post Thread to find it.',
      required: true,
    }),
  },
  async run(context) {
    const { userId, teamId, threadId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/threads/${encodeURIComponent(threadId)}/following`,
    });
  },
});

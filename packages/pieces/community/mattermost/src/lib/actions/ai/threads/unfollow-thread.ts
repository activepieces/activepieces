import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const unfollowThreadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_unfollow_thread',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Unfollow Thread',
  description: 'Stops following a thread for a user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a user stop following a thread so its replies no longer notify them; pass "me" for the connected account. Unfollowing a thread that is not followed changes nothing. Undo with Follow Thread.',
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
      method: HttpMethod.DELETE,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/threads/${encodeURIComponent(threadId)}/following`,
    });
  },
});

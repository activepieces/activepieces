import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetThreadOutputSchema } from '../../../output-schemas';

export const getThreadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_thread',
  outputSchema: mattermostGetThreadOutputSchema,
  displayName: 'Get Followed Thread',
  description: 'Gets a thread a user follows, with its unread state.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one followed thread with its reply count, participants, last reply time and unread counts for the user; pass "me" for the connected account. Use Get Post Thread for the posts themselves.',
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
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/threads/${encodeURIComponent(threadId)}`,
    });
  },
});

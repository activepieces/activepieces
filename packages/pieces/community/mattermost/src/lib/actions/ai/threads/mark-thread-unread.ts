import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostMarkThreadReadOutputSchema } from '../../../output-schemas';

export const markThreadUnreadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_mark_thread_unread',
  outputSchema: mattermostMarkThreadReadOutputSchema,
  displayName: 'Mark Thread Unread',
  description: 'Marks a followed thread as unread from a given reply onward.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks a thread a user follows as unread starting at one of its posts; pass "me" for the connected account. Post ID must belong to the thread (Get Post Thread lists them).',
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
    postId: mattermostAiProps.postId({
      required: true,
      description: 'ID (26 characters) of the post in the thread to mark unread from. Use Get Post Thread to find it.',
    }),
  },
  async run(context) {
    const { userId, teamId, threadId, postId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/threads/${encodeURIComponent(threadId)}/set_unread/${encodeURIComponent(postId)}`,
    });
  },
});

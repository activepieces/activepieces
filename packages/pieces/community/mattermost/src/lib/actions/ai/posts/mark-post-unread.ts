import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostMarkPostUnreadOutputSchema } from '../../../output-schemas';

export const markPostUnreadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_mark_post_unread',
  outputSchema: mattermostMarkPostUnreadOutputSchema,
  displayName: 'Mark Post Unread',
  description: 'Marks a channel as unread from a given post onward.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks the post\'s channel as unread for a user starting at that post; pass "me" for the connected account. To mark a reply unread in a followed thread use Mark Thread Unread.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    postId: mattermostAiProps.postId({ required: true }),
  },
  async run(context) {
    const { userId, postId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/users/${encodeURIComponent(userId)}/posts/${encodeURIComponent(postId)}/set_unread`,
    });
  },
});

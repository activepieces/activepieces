import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const deleteThreadDraftAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_delete_thread_draft',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Delete Thread Draft',
  description: 'Deletes a user\'s draft reply in a thread.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a user\'s unsent draft reply in one thread for good; pass "me" for the connected account. Thread ID is the root_id of the draft from List Drafts. For a channel draft use Delete Draft.',
    idempotent: false,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    channelId: mattermostAiProps.channelId({ required: true }),
    threadId: mattermostAiProps.postId({
      required: true,
      displayName: 'Thread ID',
      description: 'ID of the thread root post (26 characters), the draft\'s root_id from List Drafts.',
    }),
  },
  async run(context) {
    const { userId, channelId, threadId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/users/${encodeURIComponent(userId)}/channels/${encodeURIComponent(channelId)}/drafts/${encodeURIComponent(threadId)}`,
    });
  },
});

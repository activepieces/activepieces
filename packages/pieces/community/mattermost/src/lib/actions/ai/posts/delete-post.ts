import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const deletePostAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_delete_post',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Delete Post',
  description: 'Deletes a post.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a post; deleting a thread root also deletes its replies. Users can no longer see or restore it. Only the author or a user with permission to delete others\' posts can do this.',
    idempotent: false,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/posts/${encodeURIComponent(context.propsValue.postId)}`,
    });
  },
});

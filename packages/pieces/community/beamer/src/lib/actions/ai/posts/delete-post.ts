import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import { beamerDeletePostOutputSchema } from '../../../output-schemas';

export const deletePostAction = createAction({
  auth: beamerAuth,
  name: 'beamer_delete_post',
  outputSchema: beamerDeletePostOutputSchema,
  displayName: 'Delete Post',
  description: 'Permanently deletes a Beamer post.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Beamer post and its translations; it cannot be restored. To hide a post instead, use Update Post with Archive "true". Get the ID from List Posts.',
    idempotent: false,
  },
  props: {
    postId: beamerAiProps.postId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await beamerClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/posts/${encodeURIComponent(propsValue.postId)}`,
    });
    return { deleted: true, postId: propsValue.postId };
  },
});

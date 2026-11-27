import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteCommentOutputSchema } from '../../../output-schemas';

export const deleteCommentAction = createAction({
  auth: boxAuth,
  name: 'box_delete_comment',
  outputSchema: boxDeleteCommentOutputSchema,
  displayName: 'Delete Comment',
  description: 'Permanently deletes a Box comment.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a comment; it cannot be restored. Get the ID from List File Comments.',
    idempotent: false,
  },
  props: {
    commentId: boxAiProps.commentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/comments/${encodeURIComponent(propsValue.commentId)}`,
    });
    return { deleted: true, commentId: propsValue.commentId };
  },
});

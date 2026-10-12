import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressAuth } from '../..';
import { wordpressApi } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { deleteCommentOutputSchema } from '../output-schemas';

export const deleteCommentAction = createAction({
  auth: wordpressAuth,
  name: 'delete_comment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Comment Permanently',
  description: 'Permanently deletes a comment, skipping the trash. This cannot be undone.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a WordPress comment, bypassing the trash; it cannot be restored. Use moderate_comment with "trash" or "spam" when the comment may need to come back. A repeat call fails because the comment no longer exists.',
    idempotent: false,
  },
  outputSchema: deleteCommentOutputSchema,
  props: {
    comment_id: Property.Number({
      displayName: 'Comment ID',
      description: 'ID of the comment to delete, from list_comments.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = wordpressContent.requireWholeNumber({ value: propsValue.comment_id, propName: 'Comment ID' });
    return wordpressApi.forceDelete({ auth, path: `/comments/${id}` });
  },
});

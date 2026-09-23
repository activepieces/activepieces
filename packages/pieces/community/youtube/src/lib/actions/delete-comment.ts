import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { deleteCommentOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeDeleteCommentAction = createAction({
  auth: youtubeAuth,
  outputSchema: deleteCommentOutputSchema,
  name: 'delete_comment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Comment',
  description: 'Permanently delete a comment or reply.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a YouTube comment or reply via comments.delete. Use Set Comment Moderation Status to hold or reject a comment recoverably instead of destroying it. Only comments the authenticated account authored, or comments on its own videos, can be deleted, and a repeated call fails because the comment is gone.',
    idempotent: false,
  },
  props: {
    commentId: Property.ShortText({
      displayName: 'Comment ID',
      description:
        'The comment or reply ID, from List Comment Threads or from Post Video Comment.',
      required: true,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { commentId } = context.propsValue;

    await youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.DELETE,
      path: '/comments',
      operation: 'Delete Comment',
      queryParams: { id: commentId },
    });

    return { success: true, commentId };
  },
});

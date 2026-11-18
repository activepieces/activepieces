import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

export const deleteCommentAction = createAction({
  auth: figmaAuth,
  name: 'delete_comment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Comment',
  description: 'Deletes a comment you posted on a Figma file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one comment from a Figma file by file URL/key and comment ID. Only the comment author can delete it. Cannot be undone; a second call fails with 404 because the comment is gone.',
    idempotent: false,
  },
  outputSchema: figmaOutputSchemas.deleteComment,
  props: {
    file_key: figmaProps.fileKey(),
    comment_id: figmaProps.commentId('The ID of the comment to delete (from Get File Comments).'),
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const commentId = figmaClient.segment({ value: context.propsValue.comment_id, label: 'Comment ID' });
    await figmaClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/v1/files/${figmaClient.segment({ value: fileKey, label: 'File Key' })}/comments/${commentId}`,
      scope: 'file_comments:write',
      tier: 2,
      operation: 'delete the comment',
    });
    return { deleted: true, fileKey, commentId: decodeURIComponent(commentId) };
  },
});

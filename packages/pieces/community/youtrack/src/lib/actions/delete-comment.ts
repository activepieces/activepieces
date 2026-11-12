import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { commentDropdown, issueDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { deleteCommentActionOutputSchema } from '../output-schemas';

export const deleteCommentAction = createAction({
  auth: youtrackAuth,
  name: 'delete_comment',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteCommentActionOutputSchema,
  displayName: 'Delete Comment',
  description: 'Deletes a comment from an issue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Delete one comment from an issue, given the issue ID and the comment ID from List Comments. Not idempotent: a second call may fail because the comment no longer exists.',
    idempotent: false,
  },
  props: {
    issue: issueDropdown,
    comment: commentDropdown,
  },
  async run(context) {
    const issue = youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' });
    const comment = youtrackClient.segment({ value: context.propsValue.comment, label: 'Comment' });
    await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/issues/${issue}/comments/${comment}`,
      operation: 'delete the comment',
    });
    return { success: true, issue_id: context.propsValue.issue, comment_id: context.propsValue.comment };
  },
});

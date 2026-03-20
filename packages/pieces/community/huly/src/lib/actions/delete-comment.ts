import { createAction, Property } from "@activepieces/pieces-framework";
import { deleteComment } from "@hulymcp/huly/operations/comments.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const deleteCommentAction = createAction({
  auth: hulyAuth,
  name: "delete_comment",
  displayName: "Delete Comment",
  description: "Delete a comment from a Huly issue",
  props: {
    project: projectDropdown,
    issue_identifier: Property.ShortText({
      displayName: "Issue Identifier",
      description: 'Issue identifier (e.g., "HULY-123" or "123")',
      required: true,
    }),
    comment_id: Property.ShortText({
      displayName: "Comment ID",
      description: "ID of the comment to delete (from list_comments output)",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      deleteComment({
        project: context.propsValue.project,
        issueIdentifier: context.propsValue.issue_identifier,
        commentId: context.propsValue.comment_id,
      })
    );
    return {
      comment_id: result.commentId,
      issue_identifier: result.issueIdentifier,
      deleted: result.deleted,
    };
  },
});

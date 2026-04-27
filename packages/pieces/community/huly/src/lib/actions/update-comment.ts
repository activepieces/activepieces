import { createAction, Property } from "@activepieces/pieces-framework";
import { updateComment } from "@hulymcp/huly/operations/comments.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const updateCommentAction = createAction({
  auth: hulyAuth,
  name: "update_comment",
  displayName: "Update Comment",
  description: "Update a comment on a Huly issue",
  props: {
    project: projectDropdown,
    issue_identifier: Property.ShortText({
      displayName: "Issue Identifier",
      description: 'Issue identifier (e.g., "HULY-123" or "123")',
      required: true,
    }),
    comment_id: Property.ShortText({
      displayName: "Comment ID",
      description: "ID of the comment to update (from list_comments output)",
      required: true,
    }),
    body: Property.LongText({
      displayName: "New Body",
      description: "New comment text (markdown supported)",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      updateComment({
        project: context.propsValue.project,
        issueIdentifier: context.propsValue.issue_identifier,
        commentId: context.propsValue.comment_id,
        body: context.propsValue.body,
      })
    );
    return {
      comment_id: result.commentId,
      issue_identifier: result.issueIdentifier,
      updated: result.updated,
    };
  },
});

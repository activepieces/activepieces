import { createAction, Property } from "@activepieces/pieces-framework";
import { addComment } from "@hulymcp/huly/operations/comments.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const addCommentAction = createAction({
  auth: hulyAuth,
  name: "add_comment",
  displayName: "Add Comment",
  description: "Add a comment to a Huly issue",
  props: {
    project: projectDropdown,
    issue_identifier: Property.ShortText({
      displayName: "Issue Identifier",
      description: 'Issue identifier (e.g., "HULY-123" or "123")',
      required: true,
    }),
    body: Property.LongText({
      displayName: "Comment Body",
      description: "Comment text (markdown supported)",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      addComment({
        project: context.propsValue.project,
        issueIdentifier: context.propsValue.issue_identifier,
        body: context.propsValue.body,
      })
    );
    return {
      comment_id: result.commentId,
      issue_identifier: result.issueIdentifier,
    };
  },
});

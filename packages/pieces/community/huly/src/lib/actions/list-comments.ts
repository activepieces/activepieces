import { createAction, Property } from "@activepieces/pieces-framework";
import { listComments } from "@hulymcp/huly/operations/comments.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const listCommentsAction = createAction({
  auth: hulyAuth,
  name: "list_comments",
  displayName: "List Comments",
  description: "List comments on a Huly issue",
  props: {
    project: projectDropdown,
    issue_identifier: Property.ShortText({
      displayName: "Issue Identifier",
      description: 'Issue identifier (e.g., "HULY-123" or "123")',
      required: true,
    }),
  },
  async run(context) {
    const comments = await withHulyClient(
      context.auth,
      listComments({
        project: context.propsValue.project,
        issueIdentifier: context.propsValue.issue_identifier,
      })
    );
    return comments.map((c) => ({
      id: c.id,
      body: c.body,
      author: c.author ?? null,
      author_id: c.authorId ?? null,
      created_on: c.createdOn ?? null,
      modified_on: c.modifiedOn ?? null,
    }));
  },
});

/**
 * Delete Issue action — removes an issue from Huly.
 */
import { createAction, Property } from "@activepieces/pieces-framework";
import { deleteIssue } from "@hulymcp/huly/operations/issues-write.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const deleteIssueAction = createAction({
  auth: hulyAuth,
  name: "delete_issue",
  displayName: "Delete Issue",
  description: "Delete an issue from a Huly project",
  props: {
    project: projectDropdown,
    identifier: Property.ShortText({
      displayName: "Issue Identifier",
      description:
        'Issue identifier — either full (e.g., "HULY-123") or just the number (e.g., "123")',
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      deleteIssue({
        project: context.propsValue.project,
        identifier: context.propsValue.identifier,
      })
    );
    return {
      identifier: result.identifier,
      deleted: result.deleted,
    };
  },
});

/**
 * Move Issue action — moves an issue to a new parent or makes it top-level.
 */
import { createAction, Property } from "@activepieces/pieces-framework";
import { moveIssue } from "@hulymcp/huly/operations/issues-move.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const moveIssueAction = createAction({
  auth: hulyAuth,
  name: "move_issue",
  displayName: "Move Issue",
  description:
    "Move an issue under a new parent issue, or make it a top-level issue",
  props: {
    project: projectDropdown,
    identifier: Property.ShortText({
      displayName: "Issue Identifier",
      description: "Issue to move (e.g., HULY-123)",
      required: true,
    }),
    new_parent: Property.ShortText({
      displayName: "New Parent Issue",
      description:
        "Parent issue identifier to move under (e.g., HULY-42). Leave empty to make top-level.",
      required: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      moveIssue({
        project: context.propsValue.project,
        identifier: context.propsValue.identifier,
        newParent: context.propsValue.new_parent || null,
      })
    );
    return {
      identifier: result.identifier,
      moved: result.moved,
      new_parent: result.newParent ?? null,
    };
  },
});

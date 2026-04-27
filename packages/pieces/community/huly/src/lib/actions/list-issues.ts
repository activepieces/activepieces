/**
 * List Issues action — returns issues from a Huly project.
 */
import { createAction } from "@activepieces/pieces-framework";
import { listIssues } from "@hulymcp/huly/operations/issues-read.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const listIssuesAction = createAction({
  auth: hulyAuth,
  name: "list_issues",
  displayName: "List Issues",
  description: "List issues in a Huly project",
  props: {
    project: projectDropdown,
  },
  async run(context) {
    const issues = await withHulyClient(
      context.auth,
      listIssues({ project: context.propsValue.project })
    );
    return issues.map((i) => ({
      identifier: i.identifier,
      title: i.title,
      status: i.status,
      priority: i.priority ?? null,
      assignee: i.assignee ?? null,
      parent_issue: i.parentIssue ?? null,
      sub_issues: i.subIssues ?? 0,
      modified_on: i.modifiedOn ?? null,
    }));
  },
});

/**
 * Get Issue action — returns full issue details with markdown description.
 */
import { createAction, Property } from "@activepieces/pieces-framework";
import { getIssue } from "@hulymcp/huly/operations/issues-read.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const getIssueAction = createAction({
  auth: hulyAuth,
  name: "get_issue",
  displayName: "Get Issue",
  description: "Get full details of a Huly issue including its markdown description",
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
    const issue = await withHulyClient(
      context.auth,
      getIssue({
        project: context.propsValue.project,
        identifier: context.propsValue.identifier,
      })
    );
    return {
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description ?? null,
      status: issue.status,
      priority: issue.priority ?? null,
      assignee: issue.assignee ?? null,
      assignee_id: issue.assigneeRef?.id ?? null,
      assignee_name: issue.assigneeRef?.name ?? null,
      project: issue.project,
      parent_issue: issue.parentIssue ?? null,
      sub_issues: issue.subIssues ?? 0,
      modified_on: issue.modifiedOn ?? null,
      created_on: issue.createdOn ?? null,
      due_date: issue.dueDate ?? null,
      estimation: issue.estimation ?? null,
      labels: (issue.labels ?? []).map((l) => l.title).join(", "),
    };
  },
});

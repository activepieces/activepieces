/**
 * Update Issue action — updates issue fields.
 */
import { createAction, Property } from "@activepieces/pieces-framework";
import { updateIssue } from "@hulymcp/huly/operations/issues-write.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import {
  assigneeDropdown,
  componentDropdown,
  milestoneDropdown,
  priorityDropdown,
  projectDropdown,
  statusDropdown,
} from "../common/props";

export const updateIssueAction = createAction({
  auth: hulyAuth,
  name: "update_issue",
  displayName: "Update Issue",
  description: "Update fields of an existing Huly issue",
  props: {
    project: projectDropdown,
    identifier: Property.ShortText({
      displayName: "Issue Identifier",
      description:
        'Issue identifier — either full (e.g., "HULY-123") or just the number (e.g., "123")',
      required: true,
    }),
    title: Property.ShortText({
      displayName: "New Title",
      description: "New issue title (leave empty to keep current)",
      required: false,
    }),
    description: Property.LongText({
      displayName: "New Description",
      description: "New issue description in markdown (leave empty to keep current)",
      required: false,
    }),
    status: statusDropdown,
    priority: priorityDropdown,
    assignee: assigneeDropdown,
    component: componentDropdown,
    milestone: milestoneDropdown,
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      updateIssue({
        project: context.propsValue.project,
        identifier: context.propsValue.identifier,
        title: context.propsValue.title || undefined,
        description: context.propsValue.description || undefined,
        status: context.propsValue.status || undefined,
        priority: context.propsValue.priority || undefined,
        assignee: context.propsValue.assignee || undefined,
        component: context.propsValue.component || undefined,
        milestone: context.propsValue.milestone || undefined,
      })
    );
    return {
      identifier: result.identifier,
      updated: result.updated,
    };
  },
});

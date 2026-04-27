/**
 * Create Issue action — creates a new issue with chained dropdowns.
 */
import { createAction, Property } from "@activepieces/pieces-framework";
import { createIssue } from "@hulymcp/huly/operations/issues-write.js";

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

export const createIssueAction = createAction({
  auth: hulyAuth,
  name: "create_issue",
  displayName: "Create Issue",
  description: "Create a new issue in a Huly project",
  props: {
    project: projectDropdown,
    title: Property.ShortText({
      displayName: "Title",
      description: "Issue title",
      required: true,
    }),
    description: Property.LongText({
      displayName: "Description",
      description: "Issue description (markdown supported)",
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
      createIssue({
        project: context.propsValue.project,
        title: context.propsValue.title,
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
      issue_id: result.issueId,
    };
  },
});

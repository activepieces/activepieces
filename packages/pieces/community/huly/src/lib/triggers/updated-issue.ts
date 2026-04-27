/**
 * Updated Issue trigger — fires when an issue is modified in a project.
 */
import {
  createTrigger,
  TriggerStrategy,
} from "@activepieces/pieces-framework";
import { DedupeStrategy, pollingHelper } from "@activepieces/pieces-common";
import type { Polling } from "@activepieces/pieces-common";
import { listIssues } from "@hulymcp/huly/operations/issues-read.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

const polling: Polling<
  { url: string; email: string; password: string; workspace: string },
  { project: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const issues = await withHulyClient(
      auth,
      listIssues({ project: propsValue.project, limit: 50 })
    );
    return issues.filter((i) => i.modifiedOn != null).map((i) => ({
      epochMilliSeconds: i.modifiedOn!,
      data: {
        identifier: i.identifier,
        title: i.title,
        status: i.status,
        priority: i.priority ?? null,
        assignee: i.assignee ?? null,
        parent_issue: i.parentIssue ?? null,
        sub_issues: i.subIssues ?? 0,
        modified_on: i.modifiedOn ?? null,
      },
    }));
  },
};

export const updatedIssueTrigger = createTrigger({
  auth: hulyAuth,
  name: "updated_issue",
  displayName: "Issue Updated",
  description: "Triggers when an issue is updated in a Huly project",
  type: TriggerStrategy.POLLING,
  props: {
    project: projectDropdown,
  },
  sampleData: {
    identifier: "HULY-42",
    title: "Example issue",
    status: "In Progress",
    priority: "high",
    assignee: "John Doe",
    parent_issue: null,
    sub_issues: 0,
    modified_on: 1710947000000,
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

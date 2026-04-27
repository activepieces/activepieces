import { createAction, Property } from "@activepieces/pieces-framework";
import { listTestRuns } from "@hulymcp/huly/operations/test-management-runs.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listTestRunsAction = createAction({
  auth: hulyAuth, name: "list_test_runs", displayName: "List Test Runs",
  description: "List test runs in a test project",
  props: {
    project: Property.ShortText({ displayName: "Test Project", description: "Test project name or ID", required: true }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, listTestRuns({ project: context.propsValue.project }));
    return result.runs.map((r) => ({
      id: r.id, name: r.name, due_date: r.dueDate ?? null,
    }));
  },
});

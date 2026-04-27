import { createAction, Property } from "@activepieces/pieces-framework";
import { listTestResults } from "@hulymcp/huly/operations/test-management-runs.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listTestResultsAction = createAction({
  auth: hulyAuth, name: "list_test_results", displayName: "List Test Results",
  description: "List test results in a test run",
  props: {
    project: Property.ShortText({ displayName: "Test Project", description: "Test project name or ID", required: true }),
    run: Property.ShortText({ displayName: "Test Run", description: "Test run name or ID", required: true }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, listTestResults({
      project: context.propsValue.project,
      run: context.propsValue.run,
    }));
    return result.results.map((r) => ({
      id: r.id, name: r.name, test_case: r.testCase,
      status: r.status ?? null, assignee: r.assignee ?? null,
    }));
  },
});

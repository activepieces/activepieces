import { createAction, Property } from "@activepieces/pieces-framework";
import { runTestPlan } from "@hulymcp/huly/operations/test-management-runs.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const runTestPlanAction = createAction({
  auth: hulyAuth, name: "run_test_plan", displayName: "Run Test Plan",
  description: "Execute a test plan, creating a test run with results",
  props: {
    project: Property.ShortText({ displayName: "Test Project", description: "Test project name or ID", required: true }),
    plan: Property.ShortText({ displayName: "Test Plan", description: "Test plan name or ID", required: true }),
    name: Property.ShortText({ displayName: "Run Name", description: "Name for the test run (optional)", required: false }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, runTestPlan({
      project: context.propsValue.project,
      plan: context.propsValue.plan,
      name: context.propsValue.name || undefined,
    }));
    return { run_id: result.runId, name: result.name, results_created: result.resultsCreated };
  },
});

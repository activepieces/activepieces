import { createAction, Property } from "@activepieces/pieces-framework";
import { createTestPlan } from "@hulymcp/huly/operations/test-management-plans.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createTestPlanAction = createAction({
  auth: hulyAuth, name: "create_test_plan", displayName: "Create Test Plan",
  description: "Create a new test plan in a test project",
  props: {
    project: Property.ShortText({ displayName: "Test Project", description: "Test project name or ID", required: true }),
    name: Property.ShortText({ displayName: "Plan Name", description: "Name for the test plan", required: true }),
    description: Property.LongText({ displayName: "Description", description: "Plan description", required: false }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, createTestPlan({
      project: context.propsValue.project,
      name: context.propsValue.name,
      description: context.propsValue.description || undefined,
    }));
    return { id: result.id, name: result.name, created: result.created };
  },
});

import { createAction, Property } from "@activepieces/pieces-framework";
import { listTestPlans } from "@hulymcp/huly/operations/test-management-plans.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listTestPlansAction = createAction({
  auth: hulyAuth, name: "list_test_plans", displayName: "List Test Plans",
  description: "List test plans in a test project",
  props: {
    project: Property.ShortText({ displayName: "Test Project", description: "Test project name or ID", required: true }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, listTestPlans({ project: context.propsValue.project }));
    return result.plans.map((p) => ({ id: p.id, name: p.name }));
  },
});

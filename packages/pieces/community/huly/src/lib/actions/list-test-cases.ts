import { createAction, Property } from "@activepieces/pieces-framework";
import { listTestCases } from "@hulymcp/huly/operations/test-management-core.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listTestCasesAction = createAction({
  auth: hulyAuth, name: "list_test_cases", displayName: "List Test Cases",
  description: "List test cases in a test project",
  props: {
    project: Property.ShortText({ displayName: "Test Project", description: "Test project name or ID", required: true }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, listTestCases({ project: context.propsValue.project }));
    return result.testCases.map((tc) => ({
      id: tc.id, name: tc.name, type: tc.type, priority: tc.priority,
      status: tc.status, assignee: tc.assignee ?? null,
    }));
  },
});

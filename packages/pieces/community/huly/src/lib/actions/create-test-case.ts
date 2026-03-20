import { createAction, Property } from "@activepieces/pieces-framework";
import { createTestCase } from "@hulymcp/huly/operations/test-management-core.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createTestCaseAction = createAction({
  auth: hulyAuth, name: "create_test_case", displayName: "Create Test Case",
  description: "Create a new test case in a test project",
  props: {
    project: Property.ShortText({ displayName: "Test Project", description: "Test project name or ID", required: true }),
    name: Property.ShortText({ displayName: "Name", description: "Test case name", required: true }),
    suite: Property.ShortText({ displayName: "Suite", description: "Test suite name or ID (optional)", required: false }),
    type: Property.StaticDropdown<string, false>({
      displayName: "Type", description: "Test case type", required: false,
      options: { options: [
        { label: "Functional", value: "functional" }, { label: "Performance", value: "performance" },
        { label: "Regression", value: "regression" }, { label: "Security", value: "security" },
        { label: "Smoke", value: "smoke" }, { label: "Usability", value: "usability" },
      ] },
    }),
    priority: Property.StaticDropdown<string, false>({
      displayName: "Priority", description: "Test case priority", required: false,
      options: { options: [
        { label: "Urgent", value: "urgent" }, { label: "High", value: "high" },
        { label: "Medium", value: "medium" }, { label: "Low", value: "low" },
      ] },
    }),
    description: Property.LongText({ displayName: "Description", description: "Test case description", required: false }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, createTestCase({
      project: context.propsValue.project,
      name: context.propsValue.name,
      suite: context.propsValue.suite || undefined,
      type: context.propsValue.type || undefined,
      priority: context.propsValue.priority || undefined,
      description: context.propsValue.description || undefined,
    }));
    return { id: result.id, name: result.name, created: result.created };
  },
});

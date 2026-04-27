import { createAction, Property } from "@activepieces/pieces-framework";
import { createTestSuite } from "@hulymcp/huly/operations/test-management-core.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createTestSuiteAction = createAction({
  auth: hulyAuth, name: "create_test_suite", displayName: "Create Test Suite",
  description: "Create a new test suite in a test project",
  props: {
    project: Property.ShortText({ displayName: "Test Project", description: "Test project name or ID", required: true }),
    name: Property.ShortText({ displayName: "Suite Name", description: "Name for the test suite", required: true }),
    description: Property.LongText({ displayName: "Description", description: "Suite description", required: false }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, createTestSuite({
      project: context.propsValue.project,
      name: context.propsValue.name,
      description: context.propsValue.description || undefined,
    }));
    return { id: result.id, name: result.name, created: result.created };
  },
});

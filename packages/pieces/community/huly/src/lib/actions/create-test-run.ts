import { createAction, Property } from "@activepieces/pieces-framework";
import { createTestRun } from "@hulymcp/huly/operations/test-management-runs.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createTestRunAction = createAction({
  auth: hulyAuth, name: "create_test_run", displayName: "Create Test Run",
  description: "Create a new test run in a test project",
  props: {
    project: Property.ShortText({ displayName: "Test Project", description: "Test project name or ID", required: true }),
    name: Property.ShortText({ displayName: "Run Name", description: "Name for the test run", required: true }),
    description: Property.LongText({ displayName: "Description", description: "Run description", required: false }),
    due_date: Property.DateTime({ displayName: "Due Date", description: "Due date for the test run", required: false }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, createTestRun({
      project: context.propsValue.project,
      name: context.propsValue.name,
      description: context.propsValue.description || undefined,
      dueDate: context.propsValue.due_date ? new Date(context.propsValue.due_date).getTime() : undefined,
    }));
    return { id: result.id, name: result.name, created: result.created };
  },
});

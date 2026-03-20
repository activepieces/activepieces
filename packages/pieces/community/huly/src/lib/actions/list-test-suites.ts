import { createAction, Property } from "@activepieces/pieces-framework";
import { listTestSuites } from "@hulymcp/huly/operations/test-management-core.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listTestSuitesAction = createAction({
  auth: hulyAuth, name: "list_test_suites", displayName: "List Test Suites",
  description: "List test suites in a test project",
  props: {
    project: Property.ShortText({ displayName: "Test Project", description: "Test project name or ID", required: true }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, listTestSuites({ project: context.propsValue.project }));
    return result.suites.map((s) => ({
      id: s.id, name: s.name, description: s.description ?? null, parent: s.parent ?? null,
    }));
  },
});

import { createAction } from "@activepieces/pieces-framework";
import { listTestProjects } from "@hulymcp/huly/operations/test-management-core.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listTestProjectsAction = createAction({
  auth: hulyAuth, name: "list_test_projects", displayName: "List Test Projects",
  description: "List test management projects in Huly",
  props: {},
  async run(context) {
    const result = await withHulyClient(context.auth, listTestProjects({}));
    return result.projects.map((p) => ({
      id: p.id, name: p.name, description: p.description ?? null, archived: p.archived,
    }));
  },
});

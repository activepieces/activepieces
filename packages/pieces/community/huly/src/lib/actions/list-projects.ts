/**
 * List Projects action — returns all projects from Huly workspace.
 */
import { createAction } from "@activepieces/pieces-framework";
import { listProjects } from "@hulymcp/huly/operations/projects.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listProjectsAction = createAction({
  auth: hulyAuth,
  name: "list_projects",
  displayName: "List Projects",
  description: "List all projects in your Huly workspace",
  props: {},
  async run(context) {
    const result = await withHulyClient(context.auth, listProjects({}));
    return result.projects.map((p) => ({
      identifier: p.identifier,
      name: p.name,
      description: p.description ?? null,
      archived: p.archived,
    }));
  },
});

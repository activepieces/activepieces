/**
 * Get Project action — returns full project details including statuses.
 */
import { createAction, Property } from "@activepieces/pieces-framework";
import { getProject } from "@hulymcp/huly/operations/projects.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const getProjectAction = createAction({
  auth: hulyAuth,
  name: "get_project",
  displayName: "Get Project",
  description: "Get full details of a Huly project including its statuses",
  props: {
    project: projectDropdown,
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      getProject({ project: context.propsValue.project })
    );
    return {
      identifier: result.identifier,
      name: result.name,
      description: result.description ?? null,
      archived: result.archived,
      default_status: result.defaultStatus ?? null,
      statuses: result.statuses ?? [],
    };
  },
});

/**
 * Delete Project action — removes a project from Huly.
 */
import { createAction } from "@activepieces/pieces-framework";
import { deleteProject } from "@hulymcp/huly/operations/projects.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const deleteProjectAction = createAction({
  auth: hulyAuth,
  name: "delete_project",
  displayName: "Delete Project",
  description: "Delete a project from your Huly workspace",
  props: {
    project: projectDropdown,
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      deleteProject({ project: context.propsValue.project })
    );
    return {
      identifier: result.identifier,
      deleted: result.deleted,
    };
  },
});

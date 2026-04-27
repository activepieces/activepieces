/**
 * Update Project action — updates project name and/or description.
 */
import { createAction, Property } from "@activepieces/pieces-framework";
import { updateProject } from "@hulymcp/huly/operations/projects.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const updateProjectAction = createAction({
  auth: hulyAuth,
  name: "update_project",
  displayName: "Update Project",
  description: "Update the name or description of a Huly project",
  props: {
    project: projectDropdown,
    name: Property.ShortText({
      displayName: "New Name",
      description: "New project name (leave empty to keep current)",
      required: false,
    }),
    description: Property.LongText({
      displayName: "New Description",
      description:
        "New project description (leave empty to keep current, enter a single space to clear)",
      required: false,
    }),
  },
  async run(context) {
    const descValue = context.propsValue.description;
    const result = await withHulyClient(
      context.auth,
      updateProject({
        project: context.propsValue.project,
        name: context.propsValue.name || undefined,
        description:
          descValue === undefined || descValue === null
            ? undefined
            : descValue.trim() === ""
              ? null
              : descValue,
      })
    );
    return {
      identifier: result.identifier,
      updated: result.updated,
    };
  },
});

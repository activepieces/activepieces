/**
 * Create Project action — creates a new Huly project.
 */
import { createAction, Property } from "@activepieces/pieces-framework";
import { createProject } from "@hulymcp/huly/operations/projects.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createProjectAction = createAction({
  auth: hulyAuth,
  name: "create_project",
  displayName: "Create Project",
  description: "Create a new project in your Huly workspace",
  props: {
    name: Property.ShortText({
      displayName: "Project Name",
      description: "Display name for the project",
      required: true,
    }),
    identifier: Property.ShortText({
      displayName: "Identifier",
      description:
        "Unique project identifier, 1-5 uppercase characters starting with a letter (e.g., HULY, QA, DEV)",
      required: true,
    }),
    description: Property.LongText({
      displayName: "Description",
      description: "Project description",
      required: false,
    }),
    is_private: Property.Checkbox({
      displayName: "Private",
      description: "Whether the project is private (default: false)",
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      createProject({
        name: context.propsValue.name,
        identifier: context.propsValue.identifier,
        description: context.propsValue.description || undefined,
        private: context.propsValue.is_private ?? false,
      })
    );
    return {
      identifier: result.identifier,
      name: result.name,
      created: result.created,
    };
  },
});

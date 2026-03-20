import { createAction, Property } from "@activepieces/pieces-framework";
import { createTeamspace } from "@hulymcp/huly/operations/documents.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createTeamspaceAction = createAction({
  auth: hulyAuth,
  name: "create_teamspace",
  displayName: "Create Teamspace",
  description: "Create a new teamspace in your Huly workspace",
  props: {
    name: Property.ShortText({
      displayName: "Teamspace Name",
      description: "Name for the teamspace",
      required: true,
    }),
    description: Property.LongText({
      displayName: "Description",
      description: "Teamspace description",
      required: false,
    }),
    is_private: Property.Checkbox({
      displayName: "Private",
      description: "Whether the teamspace is private (default: false)",
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      createTeamspace({
        name: context.propsValue.name,
        description: context.propsValue.description || undefined,
        private: context.propsValue.is_private ?? false,
      })
    );
    return {
      id: result.id,
      name: result.name,
      created: result.created,
    };
  },
});

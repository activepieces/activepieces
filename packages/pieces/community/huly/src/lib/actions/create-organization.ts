import { createAction, Property } from "@activepieces/pieces-framework";
import { createOrganization } from "@hulymcp/huly/operations/contacts.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createOrganizationAction = createAction({
  auth: hulyAuth,
  name: "create_organization",
  displayName: "Create Organization",
  description: "Create a new organization in your Huly workspace",
  props: {
    name: Property.ShortText({
      displayName: "Organization Name",
      description: "Name of the organization",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      createOrganization({ name: context.propsValue.name })
    );
    return {
      id: result.id,
    };
  },
});

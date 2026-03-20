import { createAction, Property } from "@activepieces/pieces-framework";
import { createPerson } from "@hulymcp/huly/operations/contacts.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createPersonAction = createAction({
  auth: hulyAuth,
  name: "create_person",
  displayName: "Create Person",
  description: "Create a new person (contact) in your Huly workspace",
  props: {
    first_name: Property.ShortText({
      displayName: "First Name",
      description: "Person's first name",
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: "Last Name",
      description: "Person's last name",
      required: true,
    }),
    email: Property.ShortText({
      displayName: "Email",
      description: "Email address",
      required: false,
    }),
    city: Property.ShortText({
      displayName: "City",
      description: "City",
      required: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      createPerson({
        firstName: context.propsValue.first_name,
        lastName: context.propsValue.last_name,
        email: context.propsValue.email || undefined,
        city: context.propsValue.city || undefined,
      })
    );
    return {
      id: result.id,
    };
  },
});

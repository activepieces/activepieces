import { createAction, Property } from "@activepieces/pieces-framework";
import { updatePerson } from "@hulymcp/huly/operations/contacts.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const updatePersonAction = createAction({
  auth: hulyAuth,
  name: "update_person",
  displayName: "Update Person",
  description: "Update a person's details in Huly",
  props: {
    person_id: Property.ShortText({
      displayName: "Person ID",
      description: "ID of the person to update (from list_persons output)",
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: "First Name",
      description: "New first name (leave empty to keep current)",
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: "Last Name",
      description: "New last name (leave empty to keep current)",
      required: false,
    }),
    city: Property.ShortText({
      displayName: "City",
      description: "New city (leave empty to keep current)",
      required: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      updatePerson({
        personId: context.propsValue.person_id,
        firstName: context.propsValue.first_name || undefined,
        lastName: context.propsValue.last_name || undefined,
        city: context.propsValue.city || undefined,
      })
    );
    return {
      id: result.id,
      updated: result.updated,
    };
  },
});

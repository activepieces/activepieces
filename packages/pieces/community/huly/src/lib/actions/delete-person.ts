import { createAction, Property } from "@activepieces/pieces-framework";
import { deletePerson } from "@hulymcp/huly/operations/contacts.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const deletePersonAction = createAction({
  auth: hulyAuth,
  name: "delete_person",
  displayName: "Delete Person",
  description: "Delete a person from your Huly workspace",
  props: {
    person_id: Property.ShortText({
      displayName: "Person ID",
      description: "ID of the person to delete (from list_persons output)",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      deletePerson({ personId: context.propsValue.person_id })
    );
    return {
      id: result.id,
      deleted: result.deleted,
    };
  },
});

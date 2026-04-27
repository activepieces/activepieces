import { createAction } from "@activepieces/pieces-framework";
import { listPersons } from "@hulymcp/huly/operations/contacts.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listPersonsAction = createAction({
  auth: hulyAuth,
  name: "list_persons",
  displayName: "List Persons",
  description: "List persons (contacts) in your Huly workspace",
  props: {},
  async run(context) {
    const persons = await withHulyClient(context.auth, listPersons({}));
    return persons.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city ?? null,
      email: p.email ?? null,
      modified_on: p.modifiedOn ?? null,
    }));
  },
});

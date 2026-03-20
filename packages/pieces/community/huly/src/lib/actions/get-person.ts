import { createAction, Property } from "@activepieces/pieces-framework";
import { getPerson } from "@hulymcp/huly/operations/contacts.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const getPersonAction = createAction({
  auth: hulyAuth,
  name: "get_person",
  displayName: "Get Person",
  description: "Get full details of a person including all channels",
  props: {
    person_id: Property.ShortText({
      displayName: "Person ID or Email",
      description:
        "Person ID (from list_persons output) or email address to look up",
      required: true,
    }),
  },
  async run(context) {
    const input = context.propsValue.person_id;
    const isEmail = input.includes("@");
    const p = await withHulyClient(
      context.auth,
      getPerson(
        isEmail ? { email: input } : { personId: input }
      )
    );
    return {
      id: p.id,
      name: p.name,
      first_name: p.firstName ?? null,
      last_name: p.lastName ?? null,
      city: p.city ?? null,
      email: p.email ?? null,
      channels: (p.channels ?? [])
        .map((c) => `${c.provider}:${c.value}`)
        .join(", "),
      modified_on: p.modifiedOn ?? null,
      created_on: p.createdOn ?? null,
    };
  },
});

import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { kodeProAuth, makeKodeProRequest, KodeProAuth } from "../common";

export const upsertContact = createAction({
  auth: kodeProAuth,
  name: "upsert_contact",
  displayName: "Upsert Contact",
  description: "Create or update a contact via provider sync.",
  props: {
    provider: Property.ShortText({
      displayName: "Provider",
      description: "The source provider (e.g. housecall_pro, jobber)",
      required: true,
    }),
    external_id: Property.ShortText({
      displayName: "External ID",
      description: "The unique ID of the contact in the source system",
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: "First Name",
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: "Last Name",
      required: false,
    }),
    email: Property.ShortText({
      displayName: "Email",
      required: false,
    }),
    phone: Property.ShortText({
      displayName: "Phone",
      required: false,
    }),
    company: Property.ShortText({
      displayName: "Company",
      required: false,
    }),
    external_data: Property.Object({
      displayName: "External Data",
      description: "Additional data from the source system",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      provider: propsValue["provider"],
      external_id: propsValue["external_id"],
    };

    if (propsValue["first_name"]) body["first_name"] = propsValue["first_name"];
    if (propsValue["last_name"]) body["last_name"] = propsValue["last_name"];
    if (propsValue["email"]) body["email"] = propsValue["email"];
    if (propsValue["phone"]) body["phone"] = propsValue["phone"];
    if (propsValue["company"]) body["company"] = propsValue["company"];
    if (propsValue["external_data"]) body["external_data"] = propsValue["external_data"];

    const response = await makeKodeProRequest(
      auth as unknown as KodeProAuth,
      "/contacts/sync-inbound",
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});

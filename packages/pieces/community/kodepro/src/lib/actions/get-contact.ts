import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { kodeProAuth, makeKodeProRequest, KodeProAuth } from "../common";

export const getContact = createAction({
  auth: kodeProAuth,
  name: "get_contact",
  displayName: "Get Contact",
  description: "Look up a contact by phone, email, external ID, or provider.",
  props: {
    phone: Property.ShortText({
      displayName: "Phone",
      description: "Phone number to look up",
      required: false,
    }),
    email: Property.ShortText({
      displayName: "Email",
      description: "Email address to look up",
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: "External ID",
      description: "External ID from the source provider",
      required: false,
    }),
    provider: Property.ShortText({
      displayName: "Provider",
      description: "The source provider (e.g. housecall_pro)",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};

    if (propsValue["phone"]) queryParams["phone"] = propsValue["phone"] as string;
    if (propsValue["email"]) queryParams["email"] = propsValue["email"] as string;
    if (propsValue["external_id"]) queryParams["external_id"] = propsValue["external_id"] as string;
    if (propsValue["provider"]) queryParams["provider"] = propsValue["provider"] as string;

    const response = await makeKodeProRequest(
      auth as unknown as KodeProAuth,
      "/contacts/lookup",
      HttpMethod.GET,
      undefined,
      queryParams
    );

    return response.body;
  },
});

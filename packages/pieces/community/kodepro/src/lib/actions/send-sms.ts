import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { kodeProAuth, makeKodeProRequest, KodeProAuth } from "../common";

export const sendSms = createAction({
  auth: kodeProAuth,
  name: "send_sms",
  displayName: "Send SMS",
  description: "Send an SMS message to a contact.",
  props: {
    to: Property.ShortText({
      displayName: "To",
      description: "The recipient phone number",
      required: true,
    }),
    body: Property.LongText({
      displayName: "Body",
      description: "The SMS message body",
      required: true,
    }),
    contact_id: Property.ShortText({
      displayName: "Contact ID",
      description: "The Kode Pro contact UUID (optional, for linking to a contact)",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      to: propsValue["to"],
      body: propsValue["body"],
    };

    if (propsValue["contact_id"]) body["contact_id"] = propsValue["contact_id"];

    const response = await makeKodeProRequest(
      auth as unknown as KodeProAuth,
      "/sms/send",
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});

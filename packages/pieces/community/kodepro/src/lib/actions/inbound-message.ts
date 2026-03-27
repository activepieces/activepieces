import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { kodeProAuth, makeKodeProRequest, KodeProAuth } from "../common";

export const inboundMessage = createAction({
  auth: kodeProAuth,
  name: "inbound_message",
  displayName: "Inbound Message",
  description: "Record an inbound or outbound conversation message.",
  props: {
    contact_id: Property.ShortText({
      displayName: "Contact ID",
      description: "The Kode Pro contact UUID",
      required: true,
    }),
    channel: Property.ShortText({
      displayName: "Channel",
      description: "Communication channel (e.g. sms, email, chat)",
      required: true,
    }),
    content: Property.LongText({
      displayName: "Content",
      description: "The message content",
      required: true,
    }),
    direction: Property.StaticDropdown({
      displayName: "Direction",
      description: "Whether the message is inbound or outbound",
      required: false,
      options: {
        options: [
          { label: "Inbound", value: "inbound" },
          { label: "Outbound", value: "outbound" },
        ],
      },
    }),
    sender_type: Property.StaticDropdown({
      displayName: "Sender Type",
      description: "Who sent the message",
      required: false,
      options: {
        options: [
          { label: "Contact", value: "contact" },
          { label: "Human", value: "human" },
        ],
      },
    }),
    content_type: Property.ShortText({
      displayName: "Content Type",
      description: "MIME type or content format (e.g. text/plain)",
      required: false,
    }),
    metadata: Property.Object({
      displayName: "Metadata",
      description: "Additional metadata for the message",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      contact_id: propsValue["contact_id"],
      channel: propsValue["channel"],
      content: propsValue["content"],
    };

    if (propsValue["direction"]) body["direction"] = propsValue["direction"];
    if (propsValue["sender_type"]) body["sender_type"] = propsValue["sender_type"];
    if (propsValue["content_type"]) body["content_type"] = propsValue["content_type"];
    if (propsValue["metadata"]) body["metadata"] = propsValue["metadata"];

    const response = await makeKodeProRequest(
      auth as unknown as KodeProAuth,
      "/conversations/inbound",
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});

import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { AgentXAuth } from "../common/auth";

export const findMessage = createAction({
  auth: AgentXAuth,
  name: "find_message",
  displayName: "Find Message",
  description:
    "Gets the detailed trace information for a specific message by its ID.",

  props: {
    messageId: Property.ShortText({
      displayName: "Message ID",
      description: "The ID of the message to find.",
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { messageId } = propsValue;

    const traceIdResponse = await makeRequest(
      auth,
      HttpMethod.GET,
      `/access/messages/${messageId}/trace`
    );

    const traceId = traceIdResponse?.id;
    if (!traceId) {
      throw new Error(`Could not find a Trace ID for Message ID: ${messageId}`);
    }

    const traceDetails = await makeRequest(
      auth,
      HttpMethod.GET,
      `/access/traces/${traceId}`
    );

    return traceDetails;
  },
});

import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { AgentXAuth } from "../common/auth";
import { HttpMethod } from "@activepieces/pieces-common";
import { AgentIdDropdown } from "../common/dropdown";

export const findConversation = createAction({
  auth: AgentXAuth,
  name: "find_conversation",
  displayName: "Find Conversation",
  description: "Looks up an existing conversation by Agent ID (optionally by conversation ID).",
  props: {
    agentId: AgentIdDropdown,
    conversationId: Property.ShortText({
      displayName: "Conversation ID",
      description: "If provided, fetch only this specific conversation.",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { agentId, conversationId } = propsValue;

    if (conversationId) {
      const conversation = await makeRequest(
        auth,
        HttpMethod.GET,
        `/agents/${agentId}/conversations/${conversationId}`
      );
      return conversation;
    } else {
     
      const conversations = await makeRequest(
        auth,
        HttpMethod.GET,
        `/agents/${agentId}/conversations`
      );

      if (!Array.isArray(conversations)) {
        throw new Error("Unexpected response from AgentX API: expected an array of conversations.");
      }

      return conversations;
    }
  },
});

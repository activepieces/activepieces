import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { AgentXAuth } from "../common/auth";
import { HttpMethod } from "@activepieces/pieces-common";
import { AgentIdDropdown, ConversationIdDropdown } from "../common/dropdown";

export const findConversation = createAction({
  auth: AgentXAuth,
  name: "find_conversation",
  displayName: "Find Conversation",
  description:
    "Looks up an existing conversation by Agent ID (optionally by conversation ID or Name).",
  props: {
    agentId: AgentIdDropdown,
    conversationId: Property.ShortText({
      displayName: "Conversation ID",
      description: "Search by exact Conversation ID.",
      required: false,
    }),
    conversationName: Property.ShortText({
      displayName: "Conversation Name,tittle or ID",
      description:
        "Search conversation by its name (derived from the first message).",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { agentId, conversationId, conversationName } = propsValue;

    const addName = (conversation: any) => ({
      ...conversation,
      name:
        conversation.messages?.[0]?.text?.slice(0, 30) ||
        `Conversation ${conversation._id || conversation.id}`,
    });


    const conversations = await makeRequest(
      auth,
      HttpMethod.GET,
      `/agents/${agentId}/conversations`
    );

    if (!Array.isArray(conversations)) {
      throw new Error(
        "Unexpected response from AgentX API: expected an array of conversations."
      );
    }

    const conversationsWithName = conversations.map(addName);

    if (conversationName) {
      return conversationsWithName.filter((c) =>
        c.name.toLowerCase().includes(conversationName.toLowerCase())
      );
    }
    if (conversationId) {
      return conversationsWithName.filter(
        (c) => c.id === conversationId || c._id === conversationId
      );
    }

    return conversationsWithName;
  },
});

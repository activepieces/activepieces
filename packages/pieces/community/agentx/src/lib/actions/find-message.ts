import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common/client";
import { AgentXAuth } from "../common/auth";
import { AgentIdDropdown, ConversationIdDropdown } from "../common/dropdown";

type Message = {
  id: string;
  text?: string;
  [key: string]: unknown;
};

type ConversationDetail = {
  id: string;
  messages: Message[];
  [key: string]: unknown;
};

export const findMessage = createAction({
  auth: AgentXAuth,
  name: "find_message",
  displayName: "Find Message",
  description:
    "Searches for a specific message by ID (or searches text within messages) inside a conversation.",

  props: {
    agentId: AgentIdDropdown,
    conversationId: ConversationIdDropdown,
    searchTerm: Property.ShortText({
      displayName: "Search Term",
      description:
        "Text to search for in message content. Leave blank if searching by Message ID.",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { agentId, conversationId, searchTerm } = propsValue;

    const conversation = await makeRequest(
      auth,
      HttpMethod.GET,
      `/agents/${agentId}/conversations/${conversationId}`
    ) as ConversationDetail;

    const allMessages = conversation?.messages || [];

    if (!searchTerm) {
      return allMessages;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allMessages.filter(
      (m: any) =>
        (m.text && m.text.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (m.content && m.content.toLowerCase().includes(lowerCaseSearchTerm))
    );
  },
});
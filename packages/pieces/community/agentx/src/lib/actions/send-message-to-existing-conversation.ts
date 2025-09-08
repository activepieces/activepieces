import { createAction, Property } from '@activepieces/pieces-framework';
import { AgentXAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendMessageToExistingConversation = createAction({
  auth: AgentXAuth,
  name: 'sendMessageToExistingConversation',
  displayName: 'Send Message to Existing Conversation',
  description: '',
  props: {
    conversationId: Property.ShortText({
      displayName: "Conversation ID",
      description: "The ID of the conversation to send the message to.",
      required: true,
    }),
    agentMode: Property.StaticDropdown({
      displayName: "Agent Mode",
      description: "Choose how the agent should respond",
      required: true,
      options: {
        disabled: false,
        options: [
          { label: "Chat", value: "chat" },
          { label: "Search", value: "search" },
        ],
      },
    }),
    message: Property.LongText({
      displayName: "Message",
      description: "The message you want to send to the agent.",
      required: true,
    }),
    context: Property.Number({
      displayName: "Memory Context",
      description:
        "Number of previous messages to include. 0 = as much as possible, 1 = only last message, etc.",
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { conversationId, agentMode, message, context } = propsValue;

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/conversations/${conversationId}/message`,
      {
        conversationId,
        agentMode,
        message,
        context,
      }
    )
    return response;
  },
});

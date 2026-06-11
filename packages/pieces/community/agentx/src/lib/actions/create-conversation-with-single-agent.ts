import { createAction, Property } from '@activepieces/pieces-framework';
import { AgentXAuth } from '../common/auth';
import { AgentIdDropdown } from '../common/dropdown';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';


export const createConversationWithSingleAgent = createAction({
  auth: AgentXAuth,
  name: 'createConversationWithSingleAgent',
  displayName: 'Create Conversation With Single Agent',
  description: 'Create a new conversation with a specific Agent by ID.',
  audience: 'both',
  aiMetadata: { description: 'Opens a new conversation thread with a specific AgentX agent (identified by agent ID), choosing the conversation type (chat, search, or ecommerce). Use this to begin an interaction before sending messages; it does not send any message itself. Each call starts a fresh conversation, so calling it repeatedly creates multiple separate conversations (not idempotent).', idempotent: false },
  props: {
    agentId: AgentIdDropdown,
    type: Property.StaticDropdown({
      displayName: "Conversation Type",
      description: "Choose the type of conversation",
      required: true,
      options: {
        disabled: false,
        options: [
          { label: "Chat", value: "chat" },
          { label: "Search", value: "search" },
          { label: "Ecommerce", value: "ecommerce" },
        ],
      },
    }),

  },
  async run({ auth, propsValue }) {
    const { agentId, type } = propsValue;

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      `/agents/${agentId}/conversations/new`,
      {
        type
      }
    )
    return response;
  },
});

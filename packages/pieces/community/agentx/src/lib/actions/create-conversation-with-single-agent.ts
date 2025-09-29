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
      auth as string,
      HttpMethod.POST,
      `/agents/${agentId}/conversations/new`,
      {
        type
      }
    )
    return response;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { agentxAuth } from '../auth';
import { agentxApi } from '../common/api';
import { agentxProps } from '../common/props';

export const createConversationWithSingleAgentAction = createAction({
  auth: agentxAuth,
  name: 'createConversationWithSingleAgent',
  classification: 'WRITE',
  displayName: 'Create Conversation With Single Agent',
  description: 'Create a new conversation with a specific Agent by ID.',
  audience: 'both',
  aiMetadata: { description: 'Opens a new conversation thread with a specific AgentX agent (identified by agent ID), choosing the conversation type (chat, search, or ecommerce). Use this to begin an interaction before sending messages; it does not send any message itself. Each call starts a fresh conversation, so calling it repeatedly creates multiple separate conversations (not idempotent).', idempotent: false },
  props: {
    agentId: agentxProps.agentId({ required: true }),
    type: Property.StaticDropdown({
      displayName: 'Conversation Type',
      description: 'Choose the type of conversation',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Chat', value: 'chat' },
          { label: 'Search', value: 'search' },
          { label: 'Ecommerce', value: 'ecommerce' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { agentId, type } = propsValue;
    return await agentxApi.createConversation({ auth, agentId, type });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxAiProps } from '../../common/ai-props';
import { agentxApi } from '../../common/api';

export const createConversationAction = createAction({
  auth: agentxAuth,
  name: 'agentx_create_conversation',
  displayName: 'Create Conversation',
  description: 'Starts a new conversation with an AgentX agent.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a new, empty conversation with one AgentX agent (agent ID from List Agents) and returns it; it sends no message. Follow with Send Message using the returned conversation ID. Every call creates another conversation.',
    idempotent: false,
  },
  props: {
    agentId: agentxAiProps.agentId({ required: true }),
    type: Property.StaticDropdown({
      displayName: 'Conversation Type',
      description: 'The conversation type: chat, search or ecommerce.',
      required: true,
      defaultValue: 'chat',
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

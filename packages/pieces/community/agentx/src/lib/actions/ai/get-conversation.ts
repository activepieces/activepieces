import { createAction } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxAiProps } from '../../common/ai-props';
import { agentxApi } from '../../common/api';

export const getConversationAction = createAction({
  auth: agentxAuth,
  name: 'agentx_get_conversation',
  displayName: 'Get Conversation',
  description: 'Gets an AgentX conversation with all its messages.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one AgentX conversation with all of its messages, by agent ID (from List Agents) and conversation ID (from List Conversations). Message IDs here feed Get Message Trace.',
    idempotent: true,
  },
  props: {
    agentId: agentxAiProps.agentId({ required: true }),
    conversationId: agentxAiProps.conversationId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const { agentId, conversationId } = propsValue;
    return await agentxApi.getConversation({ auth, agentId, conversationId });
  },
});

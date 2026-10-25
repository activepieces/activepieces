import { createAction } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxAiProps } from '../../common/ai-props';
import { agentxApi } from '../../common/api';

export const listConversationsAction = createAction({
  auth: agentxAuth,
  name: 'agentx_list_conversations',
  displayName: 'List Conversations',
  description: 'Lists the conversations of an AgentX agent.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every conversation of one AgentX agent (agent ID from List Agents). Use it to find a conversation ID for Get Conversation, Send Message or the context actions.',
    idempotent: true,
  },
  props: {
    agentId: agentxAiProps.agentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const conversations = await agentxApi.listConversations({
      auth,
      agentId: propsValue.agentId,
    });
    return { conversations, count: conversations.length };
  },
});

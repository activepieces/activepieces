import { createAction, Property } from '@activepieces/pieces-framework';
import { agentxAuth } from '../auth';
import { agentxApi } from '../common/api';
import { agentxProps } from '../common/props';
import type { AgentxConversation } from '../common/types';

export const findConversationAction = createAction({
  auth: agentxAuth,
  name: 'find_conversation',
  classification: 'SEARCH',
  displayName: 'Find Conversation',
  description: 'Looks up an existing conversation by Agent ID (optionally by conversation ID or Name).',
  audience: 'both',
  aiMetadata: { description: "Lists conversations belonging to a specific AgentX agent (by agent ID); optionally filter to a single conversation by exact conversation ID, or by name (a partial, case-insensitive match against the name derived from the conversation's first message). Leave both filters blank to return all of the agent's conversations. Use this to resolve a conversation ID before sending or finding messages. Read-only and idempotent.", idempotent: true },
  props: {
    agentId: agentxProps.agentId({ required: true }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'Search by exact Conversation ID.',
      required: false,
    }),
    conversationName: Property.ShortText({
      displayName: 'Conversation Name,tittle or ID',
      description: 'Search conversation by its name (derived from the first message).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { agentId, conversationId, conversationName } = propsValue;

    const conversations = await agentxApi.listConversations({ auth, agentId });

    if (!Array.isArray(conversations)) {
      throw new Error('Unexpected response from AgentX API: expected an array of conversations.');
    }

    const conversationsWithName = conversations.map(addName);

    if (conversationName) {
      return conversationsWithName.filter((c) => c.name.toLowerCase().includes(conversationName.toLowerCase()));
    }
    if (conversationId) {
      return conversationsWithName.filter((c) => c.id === conversationId || c._id === conversationId);
    }

    return conversationsWithName;
  },
});

function addName(conversation: AgentxConversation) {
  return {
    ...conversation,
    name: conversation.messages?.[0]?.text?.slice(0, 30) || `Conversation ${conversation._id || conversation.id}`,
  };
}

import { createAction, Property } from '@activepieces/pieces-framework';
import { agentxAuth } from '../auth';
import { agentxApi } from '../common/api';
import { agentxProps } from '../common/props';

export const findMessageAction = createAction({
  auth: agentxAuth,
  name: 'find_message',
  classification: 'SEARCH',
  displayName: 'Find Message',
  description: 'Searches for a specific message by ID (or searches text within messages) inside a conversation.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves messages from a specific AgentX conversation (by agent ID and conversation ID): leave the search term blank to return all messages in the conversation, or provide a search term to return only messages whose text contains it (case-insensitive). Use this to inspect or find content within a conversation. Read-only and idempotent.', idempotent: true },
  props: {
    agentId: agentxProps.agentId({ required: true }),
    conversationId: agentxProps.conversationId({ required: false }),
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Text to search for in message content. Leave blank if searching by Message ID.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { agentId, conversationId, searchTerm } = propsValue;

    const conversation = await agentxApi.getConversation({ auth, agentId, conversationId });

    const allMessages = conversation?.messages || [];

    if (!searchTerm) {
      return allMessages;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allMessages.filter(
      (m) =>
        (m.text && m.text.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (m.content && m.content.toLowerCase().includes(lowerCaseSearchTerm)),
    );
  },
});

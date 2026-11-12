import { QueryKey } from '@tanstack/react-query';

function allConversationLists(): QueryKey {
  return [CONVERSATIONS];
}

function conversationList(agentId?: string): QueryKey {
  return [CONVERSATIONS, agentId ?? 'chat'];
}

function conversation(conversationId: string | null): QueryKey {
  return [CONVERSATION, conversationId];
}

const CONVERSATIONS = 'chat-conversations';
const CONVERSATION = 'chat-conversation';

export const chatQueryKeys = {
  allConversationLists,
  conversationList,
  conversation,
};

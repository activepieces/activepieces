import {
  type ChatHistoryMessage,
  type PersistedChatMessage,
  ChatConversation,
  CreateChatConversationRequest,
  SeekPage,
  UpdateChatConversationRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

async function createConversation(
  request: CreateChatConversationRequest,
): Promise<ChatConversation> {
  return api.post<ChatConversation>('/v1/chat/conversations', request);
}

async function listConversations({
  cursor,
  limit = 20,
}: {
  cursor?: string;
  limit?: number;
}): Promise<SeekPage<ChatConversation>> {
  return api.get<SeekPage<ChatConversation>>('/v1/chat/conversations', {
    limit,
    cursor,
  });
}

async function getConversation(id: string): Promise<ChatConversation> {
  return api.get<ChatConversation>(`/v1/chat/conversations/${id}`);
}

async function getMessages(
  conversationId: string,
): Promise<{ data: PersistedChatMessage[] | ChatHistoryMessage[] }> {
  return api.get<{ data: PersistedChatMessage[] | ChatHistoryMessage[] }>(
    `/v1/chat/conversations/${conversationId}/messages`,
  );
}

async function updateConversation(
  id: string,
  request: UpdateChatConversationRequest,
): Promise<ChatConversation> {
  return api.post<ChatConversation>(`/v1/chat/conversations/${id}`, request);
}

async function deleteConversation(id: string): Promise<void> {
  return api.delete<void>(`/v1/chat/conversations/${id}`);
}

export const chatApi = {
  createConversation,
  listConversations,
  getConversation,
  getMessages,
  updateConversation,
  deleteConversation,
};

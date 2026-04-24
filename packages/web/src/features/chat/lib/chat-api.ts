import {
  type ChatHistoryMessage,
  ChatConversation,
  CreateChatConversationRequest,
  SeekPage,
  UpdateChatConversationRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

function projectId(): string {
  return authenticationSession.getProjectId()!;
}

async function createConversation(
  request: CreateChatConversationRequest,
): Promise<ChatConversation> {
  return api.post<ChatConversation>('/v1/chat/conversations', request, {
    projectId: projectId(),
  });
}

async function listConversations({
  cursor,
  limit = 20,
}: {
  cursor?: string;
  limit?: number;
}): Promise<SeekPage<ChatConversation>> {
  return api.get<SeekPage<ChatConversation>>('/v1/chat/conversations', {
    projectId: projectId(),
    limit,
    cursor,
  });
}

async function getMessages(
  conversationId: string,
): Promise<{ data: ChatHistoryMessage[] }> {
  return api.get<{ data: ChatHistoryMessage[] }>(
    `/v1/chat/conversations/${conversationId}/messages`,
    { projectId: projectId() },
  );
}

async function updateConversation(
  id: string,
  request: UpdateChatConversationRequest,
): Promise<ChatConversation> {
  return api.post<ChatConversation>(`/v1/chat/conversations/${id}`, request, {
    projectId: projectId(),
  });
}

async function deleteConversation(id: string): Promise<void> {
  return api.delete<void>(`/v1/chat/conversations/${id}`, {
    projectId: projectId(),
  });
}

async function warm(): Promise<{ configured: boolean }> {
  return api.post<{ configured: boolean }>('/v1/chat/warm', undefined, {
    projectId: projectId(),
  });
}

export const chatApi = {
  createConversation,
  listConversations,
  getMessages,
  updateConversation,
  deleteConversation,
  warm,
};

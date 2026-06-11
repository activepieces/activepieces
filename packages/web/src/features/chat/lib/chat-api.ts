import {
  type ChatHistoryMessage,
  type PersistedChatMessage,
  ChatConversation,
  ConnectionOption,
  CreateChatConversationRequest,
  ResolveSetupFormOptionsRequest,
  ResolveSetupFormOptionsResponse,
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

async function sendMessage({
  conversationId,
  content,
  runId,
  files,
}: {
  conversationId: string;
  content: string;
  runId?: string;
  files?: Array<{ name: string; mimeType: string; data: string }>;
}): Promise<{ conversationId: string; runId?: string }> {
  return api.post<{ conversationId: string; runId?: string }>(
    `/v1/chat/conversations/${conversationId}/messages`,
    { content, runId, files },
  );
}

async function approveToolCall({
  gateId,
  approved,
  payload,
}: {
  gateId: string;
  approved: boolean;
  payload?: Record<string, unknown>;
}): Promise<void> {
  return api.post<void>(`/v1/chat/tool-approvals/${gateId}`, {
    approved,
    payload,
  });
}

async function cancelConversation(conversationId: string): Promise<void> {
  return api.post<void>(`/v1/chat/conversations/${conversationId}/cancel`);
}

async function getPickerConnections({
  conversationId,
  pieceName,
}: {
  conversationId: string;
  pieceName: string;
}): Promise<ConnectionOption[]> {
  return api.get(`/v1/chat/conversations/${conversationId}/connections`, {
    pieceName,
  });
}

async function resolveSetupFormOptions({
  conversationId,
  request,
}: {
  conversationId: string;
  request: ResolveSetupFormOptionsRequest;
}): Promise<ResolveSetupFormOptionsResponse> {
  return api.post<ResolveSetupFormOptionsResponse>(
    `/v1/chat/conversations/${conversationId}/resolve-options`,
    request,
  );
}

async function getPendingGate(conversationId: string): Promise<{
  gateId: string;
  toolName: string;
  displayName: string;
  toolInput: Record<string, unknown>;
} | null> {
  return api.get(`/v1/chat/conversations/${conversationId}/pending-gate`);
}

export const chatApi = {
  createConversation,
  listConversations,
  getConversation,
  getMessages,
  updateConversation,
  deleteConversation,
  sendMessage,
  approveToolCall,
  cancelConversation,
  getPickerConnections,
  getPendingGate,
  resolveSetupFormOptions,
};

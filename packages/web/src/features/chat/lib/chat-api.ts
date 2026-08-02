import { SeekPage } from '@activepieces/core-utils';
import {
  type AgentFeedbackReason,
  type AgentHistoryMessage,
  type PersistedAgentMessage,
  AgentConversation,
  ConnectionOption,
  CreateAgentConversationRequest,
  GetAgentMemoryResponse,
  ImportAgentMemoryRequest,
  InstructAgentMemoryRequest,
  UpdateAgentConversationRequest,
  UpdateAgentMemoryRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

async function createConversation(
  request: CreateAgentConversationRequest,
): Promise<AgentConversation> {
  return api.post<AgentConversation>('/v1/agents/conversations', request);
}

async function listConversations({
  cursor,
  limit = 20,
}: {
  cursor?: string;
  limit?: number;
}): Promise<SeekPage<AgentConversation>> {
  return api.get<SeekPage<AgentConversation>>('/v1/agents/conversations', {
    limit,
    cursor,
  });
}

async function getConversation(id: string): Promise<AgentConversation> {
  return api.get<AgentConversation>(`/v1/agents/conversations/${id}`);
}

async function getMessages(
  conversationId: string,
): Promise<{ data: PersistedAgentMessage[] | AgentHistoryMessage[] }> {
  return api.get<{ data: PersistedAgentMessage[] | AgentHistoryMessage[] }>(
    `/v1/agents/conversations/${conversationId}/messages`,
  );
}

async function updateConversation(
  id: string,
  request: UpdateAgentConversationRequest,
): Promise<AgentConversation> {
  return api.post<AgentConversation>(`/v1/agents/conversations/${id}`, request);
}

async function deleteConversation(id: string): Promise<void> {
  return api.delete<void>(`/v1/agents/conversations/${id}`);
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
    `/v1/agents/conversations/${conversationId}/messages`,
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
  return api.post<void>(`/v1/agents/tool-approvals/${gateId}`, {
    approved,
    payload,
  });
}

async function cancelConversation(conversationId: string): Promise<void> {
  return api.post<void>(`/v1/agents/conversations/${conversationId}/cancel`);
}

async function submitMessageFeedback({
  conversationId,
  messageIndex,
  rating,
  reasons,
  comment,
}: {
  conversationId: string;
  messageIndex: number;
  rating: 'up' | 'down' | null;
  reasons?: AgentFeedbackReason[];
  comment?: string;
}): Promise<void> {
  return api.post<void>(
    `/v1/agents/conversations/${conversationId}/messages/${messageIndex}/feedback`,
    { rating, reasons, comment },
  );
}

async function getPickerConnections({
  conversationId,
  pieceName,
}: {
  conversationId: string;
  pieceName: string;
}): Promise<ConnectionOption[]> {
  return api.get(`/v1/agents/conversations/${conversationId}/connections`, {
    pieceName,
  });
}

async function getPendingGate(
  conversationId: string,
): Promise<PendingGate | null> {
  return api.get(`/v1/agents/conversations/${conversationId}/pending-gate`);
}

async function recordLanding(): Promise<void> {
  return api.post<void>('/v1/agents/funnel/landing');
}

async function getMemory(): Promise<GetAgentMemoryResponse> {
  return api.get<GetAgentMemoryResponse>('/v1/agents/memory');
}

async function saveMemory(
  request: UpdateAgentMemoryRequest,
): Promise<GetAgentMemoryResponse> {
  return api.post<GetAgentMemoryResponse>('/v1/agents/memory', request);
}

async function importMemory(
  request: ImportAgentMemoryRequest,
): Promise<GetAgentMemoryResponse> {
  return api.post<GetAgentMemoryResponse>('/v1/agents/memory/import', request);
}

async function instructMemory(
  request: InstructAgentMemoryRequest,
): Promise<GetAgentMemoryResponse> {
  return api.post<GetAgentMemoryResponse>(
    '/v1/agents/memory/instruct',
    request,
  );
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
  submitMessageFeedback,
  getPickerConnections,
  getPendingGate,
  recordLanding,
  getMemory,
  saveMemory,
  importMemory,
  instructMemory,
};

export type PendingGate = {
  gateId: string;
  toolName: string;
  displayName: string;
  toolInput: Record<string, unknown>;
};

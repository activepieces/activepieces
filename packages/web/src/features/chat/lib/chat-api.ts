import { SeekPage } from '@activepieces/core-utils';
import {
  AgentMessageSource,
  AgentPageContext,
  type AgentFeedbackReason,
  type AgentHistoryMessage,
  type PersistedAgentMessage,
  AgentConversation,
  ConnectionOption,
  CreateAgentConversationRequest,
  GetAgentMemoryResponse,
  ImportAgentMemoryRequest,
  InstructAgentMemoryRequest,
  MemoryImportNudgeClaimResponse,
  MemoryImportNudgeResponse,
  UpdateAgentConversationRequest,
  UpdateAgentMemoryRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

async function createConversation({
  request,
  signal,
}: {
  request: CreateAgentConversationRequest;
  signal?: AbortSignal;
}): Promise<AgentConversation> {
  return api.any<AgentConversation>('/v1/agents/conversations', {
    method: 'POST',
    data: request,
    signal,
  });
}

async function listConversations({
  cursor,
  limit = 20,
  agentId,
}: {
  cursor?: string;
  limit?: number;
  agentId?: string;
}): Promise<SeekPage<AgentConversation>> {
  return api.get<SeekPage<AgentConversation>>('/v1/agents/conversations', {
    limit,
    cursor,
    ...(agentId === undefined ? {} : { agentId }),
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

function deleteConversationOnExit(id: string): void {
  api
    .any<void>(`/v1/agents/conversations/${id}`, {
      method: 'DELETE',
      adapter: 'fetch',
      fetchOptions: { keepalive: true },
    })
    .catch(() => undefined);
}

async function sendMessage({
  conversationId,
  content,
  runId,
  files,
  messageSource,
  pageContext,
}: {
  conversationId: string;
  content: string;
  runId?: string;
  files?: Array<{ name: string; mimeType: string; data: string }>;
  messageSource?: AgentMessageSource;
  pageContext?: AgentPageContext;
}): Promise<{ conversationId: string; runId?: string }> {
  return api.post<{ conversationId: string; runId?: string }>(
    `/v1/agents/conversations/${conversationId}/messages`,
    { content, runId, files, messageSource, pageContext },
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
}): Promise<{ connections: ConnectionOption[]; reconnectOnly: boolean }> {
  return api.get(`/v1/agents/conversations/${conversationId}/connections`, {
    pieceName,
  });
}

async function getPendingGate(
  conversationId: string,
): Promise<PendingGate | null> {
  return api.get(`/v1/agents/conversations/${conversationId}/pending-gate`);
}

async function getMemory(): Promise<GetAgentMemoryResponse> {
  return api.get<GetAgentMemoryResponse>('/v1/agents/memory');
}

async function getMemoryImportNudge(): Promise<MemoryImportNudgeResponse> {
  return api.get<MemoryImportNudgeResponse>('/v1/agents/memory/import-nudge');
}

async function claimMemoryImportNudge(): Promise<MemoryImportNudgeClaimResponse> {
  return api.post<MemoryImportNudgeClaimResponse>(
    '/v1/agents/memory/import-nudge/claim',
  );
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
  deleteConversationOnExit,
  sendMessage,
  approveToolCall,
  cancelConversation,
  submitMessageFeedback,
  getPickerConnections,
  getPendingGate,
  getMemory,
  getMemoryImportNudge,
  claimMemoryImportNudge,
  saveMemory,
  importMemory,
  instructMemory,
};

export type PendingGate = {
  gateId: string;
  toolName: string;
  displayName: string;
  toolInput: Record<string, unknown>;
  taskTitle?: string;
};

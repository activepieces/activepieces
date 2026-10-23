import { HttpMethod } from '@activepieces/pieces-common';

import { agentxClient } from './client';

import type {
  AgentxAgent,
  AgentxAuthValue,
  AgentxConversation,
  AgentxMessageReply,
} from './types';

async function listAgents({
  auth,
}: {
  auth: AgentxAuthValue;
}): Promise<AgentxAgent[]> {
  return await agentxClient.request<AgentxAgent[]>({
    auth,
    method: HttpMethod.GET,
    path: '/agents',
  });
}

async function listConversations({
  auth,
  agentId,
}: {
  auth: AgentxAuthValue;
  agentId: string;
}): Promise<AgentxConversation[]> {
  return await agentxClient.request<AgentxConversation[]>({
    auth,
    method: HttpMethod.GET,
    path: `/agents/${agentId}/conversations`,
  });
}

async function getConversation({
  auth,
  agentId,
  conversationId,
}: {
  auth: AgentxAuthValue;
  agentId: string;
  conversationId: string | undefined;
}): Promise<AgentxConversation> {
  return await agentxClient.request<AgentxConversation>({
    auth,
    method: HttpMethod.GET,
    path: `/agents/${agentId}/conversations/${conversationId}`,
  });
}

async function createConversation({
  auth,
  agentId,
  type,
}: {
  auth: AgentxAuthValue;
  agentId: string;
  type: string;
}): Promise<AgentxConversation> {
  return await agentxClient.request<AgentxConversation>({
    auth,
    method: HttpMethod.POST,
    path: `/agents/${agentId}/conversations/new`,
    body: { type },
  });
}

async function sendMessage({
  auth,
  conversationId,
  agentMode,
  message,
  context,
}: {
  auth: AgentxAuthValue;
  conversationId: string | undefined;
  agentMode: string;
  message: string;
  context: number | undefined;
}): Promise<AgentxMessageReply> {
  return await agentxClient.request<AgentxMessageReply>({
    auth,
    method: HttpMethod.POST,
    path: `/conversations/${conversationId}/message`,
    body: { conversationId, agentMode, message, context },
  });
}

export const agentxApi = {
  listAgents,
  listConversations,
  getConversation,
  createConversation,
  sendMessage,
};

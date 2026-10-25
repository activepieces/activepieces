import FormData from 'form-data';

import { HttpMethod } from '@activepieces/pieces-common';

import { agentxClient } from './client';

import type {
  AgentxAgent,
  AgentxAuthValue,
  AgentxConversation,
  AgentxMessageReply,
  AgentxObject,
} from './types';

async function listAgents({
  auth,
}: {
  auth: AgentxAuthValue;
}): Promise<AgentxAgent[]> {
  return await agentxClient.request<AgentxAgent[]>({
    auth,
    method: HttpMethod.GET,
    path: '/access/agents',
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
    path: `/access/agents/${agentId}/conversations`,
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
    path: `/access/agents/${agentId}/conversations/${conversationId}`,
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
    path: `/access/agents/${agentId}/conversations/new`,
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
  agentMode: string | undefined;
  message: string;
  context: number | undefined;
}): Promise<AgentxMessageReply> {
  return await agentxClient.request<AgentxMessageReply>({
    auth,
    method: HttpMethod.POST,
    path: `/access/conversations/${conversationId}/message`,
    body: { conversationId, agentMode, message, context },
  });
}

async function sendMessageWithAttachment({
  auth,
  conversationId,
  file,
  message,
  context,
}: {
  auth: AgentxAuthValue;
  conversationId: string;
  file: { filename: string; data: Buffer };
  message: string | undefined;
  context: number | undefined;
}): Promise<AgentxObject[]> {
  const form = new FormData();
  form.append('file', file.data, file.filename);
  if (message !== undefined) {
    form.append('message', message);
  }
  if (context !== undefined) {
    form.append('context', String(context));
  }
  return await agentxClient.request<AgentxObject[]>({
    auth,
    method: HttpMethod.POST,
    path: `/access/conversations/${conversationId}/attachment`,
    body: form,
    headers: { 'Content-Type': form.getHeaders()['content-type'] },
  });
}

async function addConversationContext({
  auth,
  conversationId,
  messages,
}: {
  auth: AgentxAuthValue;
  conversationId: string;
  messages: unknown[];
}): Promise<AgentxObject> {
  return await agentxClient.request<AgentxObject>({
    auth,
    method: HttpMethod.PUT,
    path: `/access/conversations/${conversationId}/update-context`,
    body: { messages },
  });
}

async function resetConversationContext({
  auth,
  conversationId,
}: {
  auth: AgentxAuthValue;
  conversationId: string;
}): Promise<AgentxObject> {
  return await agentxClient.request<AgentxObject>({
    auth,
    method: HttpMethod.DELETE,
    path: `/access/conversations/${conversationId}`,
  });
}

async function getMessageTrace({
  auth,
  messageId,
}: {
  auth: AgentxAuthValue;
  messageId: string;
}): Promise<AgentxObject> {
  return await agentxClient.request<AgentxObject>({
    auth,
    method: HttpMethod.GET,
    path: `/access/messages/${messageId}/trace`,
  });
}

async function getTrace({
  auth,
  traceId,
}: {
  auth: AgentxAuthValue;
  traceId: string;
}): Promise<AgentxObject> {
  return await agentxClient.request<AgentxObject>({
    auth,
    method: HttpMethod.GET,
    path: `/access/traces/${traceId}`,
  });
}

async function getProfile({
  auth,
}: {
  auth: AgentxAuthValue;
}): Promise<AgentxObject> {
  return await agentxClient.request<AgentxObject>({
    auth,
    method: HttpMethod.GET,
    path: '/access/getProfile',
  });
}

async function textToSpeech({
  auth,
  text,
  language,
  gender,
  speed,
  accent,
  robot,
}: TextToSpeechParams & { auth: AgentxAuthValue }): Promise<AgentxObject> {
  return await agentxClient.request<AgentxObject>({
    auth,
    method: HttpMethod.POST,
    path: '/voiceApi/tts/synthesize',
    body: { text, language, gender, speed, accent, robot },
  });
}

export const agentxApi = {
  listAgents,
  listConversations,
  getConversation,
  createConversation,
  sendMessage,
  sendMessageWithAttachment,
  addConversationContext,
  resetConversationContext,
  getMessageTrace,
  getTrace,
  getProfile,
  textToSpeech,
};

type TextToSpeechParams = {
  text: string;
  language: string | undefined;
  gender: string | undefined;
  speed: number | undefined;
  accent: string | undefined;
  robot: boolean | undefined;
};

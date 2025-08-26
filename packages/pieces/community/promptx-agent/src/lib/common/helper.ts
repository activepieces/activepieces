import { isNil } from '@activepieces/shared';
import {
  Agent,
  AgentXLoginResponseType,
  Conversation,
  PromptXAuthType,
  PromptXLoginResponseType,
  PromptXUserResponseType,
} from './types';
import querystring from 'querystring';

export const urlMap = {
  production: {
    loginUrl: 'https://centerapp.io/center/auth/login',
    myProfileUrl: 'https://centerapp.io/center//api/v1/users/me',
    agentXTokenUrl: 'https://test.oneweb.tech/zero-service//pmtx/sign-jwt',
    agentXBaseUrl: 'https://test.oneweb.tech/agentx/v1',
  },
  staging: {
    loginUrl: 'https://test.oneweb.tech/zero-service/pmtx/login',
    myProfileUrl: 'https://mocha.centerapp.io/center//api/v1/users/me',
    agentXTokenUrl: 'https://test.oneweb.tech/zero-service//pmtx/sign-jwt',
    agentXBaseUrl: 'https://test.oneweb.tech/agentx/v1',
  },
};

export const getAccessToken = async (auth: PromptXAuthType) => {
  const { server, username, password } = auth;
  const isStaging = server === 'staging';
  const body = isStaging
    ? new URLSearchParams({ username, password }).toString()
    : JSON.stringify({ username, password });
  const headers = {
    'Content-Type': isStaging
      ? 'application/x-www-form-urlencoded'
      : 'application/json',
  };
  const response = await fetch(urlMap[server].loginUrl, {
    method: 'POST',
    body,
    headers,
  });
  const data: PromptXLoginResponseType = await response.json();
  if (response.status !== 200) {
    throw new Error(data?.error || data?.message);
  }
  console.log('[promptx-agent] acquired promptx access token');
  return data?.access_token;
};

export const getUserProfile = async (auth: PromptXAuthType) => {
  if (isNil(auth.accessToken)) {
    throw new Error('Access token is missing to fetch user profile');
  }
  const { server, accessToken } = auth;
  const response = await fetch(urlMap[server].myProfileUrl, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.status !== 200) {
    throw new Error(`API error: ${response.statusText}`);
  }
  console.log('[promptx-agent] acquired promptx user profile');
  const result: PromptXUserResponseType = await response.json();
  return result;
};

export const getAgentXToken = async (auth: PromptXAuthType) => {
  const { server } = auth;
  const accessToken = await getAccessToken(auth);
  const profile = await getUserProfile({ ...auth, accessToken });
  const response = await fetch(urlMap[server].agentXTokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      email: profile.email,
      userId: profile.userIAM2ID,
      firstName: profile.firstname,
      lastName: profile.lastname,
    }),
  });
  if (response.status !== 200) {
    throw new Error(`API error: ${response.statusText}`);
  }
  console.log('[promptx-agent] acquired agentx token');
  const result: AgentXLoginResponseType = await response.json();
  return result.token;
};

export const fetchAgents = async (auth: PromptXAuthType) => {
  if (isNil(auth.agentXToken)) {
    throw new Error('Token is missing to fetch agents');
  }
  const baseUrl = `${urlMap[auth.server].agentXBaseUrl}/agents`;
  const response = await fetch(baseUrl, {
    headers: {
      Authorization: `Bearer ${auth.agentXToken}`,
    },
  });
  const agents: Agent[] = await response.json();
  console.log('[promptx-agent] acquired list of agents', agents.length);
  return agents;
};

export const fetchConversations = async (
  auth: PromptXAuthType,
  params: { slug?: string }
) => {
  if (isNil(auth.agentXToken)) {
    throw new Error('Token is missing to fetch conversations');
  }
  let baseUrl = `${urlMap[auth.server].agentXBaseUrl}/conversations`;
  if (params.slug) {
    baseUrl += `?${querystring.stringify(params)}`;
  }
  const response = await fetch(baseUrl, {
    headers: {
      Authorization: `Bearer ${auth.agentXToken}`,
    },
  });
  const conversations: Conversation[] = await response.json();
  console.log('[promptx-agent] acquired conversations', conversations.length);
  return conversations;
};

export const createConversation = async (
  auth: PromptXAuthType,
  params: { title: string; agentId: string; slug?: string }
) => {
  if (isNil(auth.agentXToken)) {
    throw new Error('Token is missing to create conversation');
  }
  const baseUrl = `${urlMap[auth.server].agentXBaseUrl}/conversations`;
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.agentXToken}`,
    },
    body: JSON.stringify(params),
  });
  if (response.status !== 200) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const conversation: Conversation = await response.json();
  console.log('[promptx-agent] created conversation', conversation.id);
  return conversation;
};

export const postChatMessage = async (
  auth: PromptXAuthType,
  threadId: string,
  message: string
) => {
  if (isNil(auth.agentXToken)) {
    throw new Error('Token is missing to post chat message');
  }
  const baseUrl = `${urlMap[auth.server].agentXBaseUrl}/chat`;
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.agentXToken}`,
    },
    body: JSON.stringify({ message, threadId }),
  });
  if (response.status !== 200) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const chatResponse: string = await response.text();
  console.log('[promptx-agent] received chat response');
  return chatResponse;
};

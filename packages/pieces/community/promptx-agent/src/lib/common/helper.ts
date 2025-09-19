import { isNil } from '@activepieces/shared';
import querystring from 'querystring';
import {
  Agent,
  AgentXLoginResponseType,
  Conversation,
  PromptXAuthType,
  PromptXLoginResponseType,
  PromptXUserResponseType,
  Server,
} from './types';

const STAGING_AUTH_URL = 'https://mocha.centerapp.io';
const PRODUCTION_AUTH_URL = 'https://centerapp.io';
const STAGING_APP_URL = 'https://test.oneweb.tech';
const PRODUCTION_APP_URL = 'https://promptxai.com';

export const fetchUrls = (
  server: Server,
  customAuthUrl?: string,
  customAppUrl?: string
) => {
  const authUrl =
    customAuthUrl ??
    (server === 'staging' ? STAGING_AUTH_URL : PRODUCTION_AUTH_URL);
  const appUrl =
    customAppUrl ??
    (server === 'staging' ? STAGING_APP_URL : PRODUCTION_APP_URL);
  const urlMap = {
    loginUrl: `${authUrl}/center/auth/login`,
    myProfileUrl: `${authUrl}/center/api/v1/users/me`,
    agentXTokenUrl: `${appUrl}/zero-service/pmtx/sign-jwt`,
    agentXBaseUrl: `${appUrl}/agentx/v1`,
  };
  return urlMap;
};

export const getAccessToken = async (auth: PromptXAuthType) => {
  const {
    server = 'production',
    customAuthUrl,
    customAppUrl,
    username,
    password,
  } = auth;
  const urls = fetchUrls(server, customAuthUrl, customAppUrl);
  const response = await fetch(urls.loginUrl, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: { 'Content-Type': 'application/json' },
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
  const {
    server = 'production',
    customAuthUrl,
    customAppUrl,
    accessToken,
  } = auth;
  const urls = fetchUrls(server, customAuthUrl, customAppUrl);
  const response = await fetch(urls.myProfileUrl, {
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
  const { server = 'production', customAuthUrl, customAppUrl } = auth;
  const urls = fetchUrls(server, customAuthUrl, customAppUrl);
  const accessToken = await getAccessToken(auth);
  const profile = await getUserProfile({ ...auth, accessToken });
  const response = await fetch(urls.agentXTokenUrl, {
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
  const { server = 'production', customAuthUrl, customAppUrl } = auth;
  const urls = fetchUrls(server, customAuthUrl, customAppUrl);
  const baseUrl = `${urls.agentXBaseUrl}/agents`;
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
  const { server = 'production', customAuthUrl, customAppUrl } = auth;
  const urls = fetchUrls(server, customAuthUrl, customAppUrl);
  let baseUrl = `${urls.agentXBaseUrl}/conversations`;
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
  const { server = 'production', customAuthUrl, customAppUrl } = auth;
  const urls = fetchUrls(server, customAuthUrl, customAppUrl);
  const baseUrl = `${urls.agentXBaseUrl}/conversations`;
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
  const { server = 'production', customAuthUrl, customAppUrl } = auth;
  const urls = fetchUrls(server, customAuthUrl, customAppUrl);
  const baseUrl = `${urls.agentXBaseUrl}/chat`;
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

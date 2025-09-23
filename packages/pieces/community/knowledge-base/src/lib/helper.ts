import { Server } from './types';

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
  return {
    CENTER_AUTH_LOGIN_URL: `${authUrl}/center/auth/login`,
    CENTER_API_USERS_ME_URL: `${authUrl}/center/api/v1/users/me`,
    KNOWLEDGE_BASE_URL: `${appUrl}/KnowledgeBaseFileService`,
    KNOWLEDGE_BASE_RUN_URL:
      server === 'staging'
        ? 'https://mlsandbox.oneweb.tech/px/retrieval'
        : 'https://centerapp.io/knowledge/retrieval',
    KNOWLEDGE_BASE_COLLECTIONS_URL: `${appUrl}/KnowledgeBaseFileService/collections`,
  };
};

export const getAccessToken = async (
  loginUrl: string,
  username: string,
  password: string
) => {
  const response = await fetch(loginUrl, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    throw new Error('Authentication failed. Please check credentials');
  }

  console.log('[knowledge-base] authenticated');

  const data: { token: string } = await response.json();
  return data.token;
};

export const getUserMe = async (
  centerUsersMeUrl: string,
  accessToken: string
) => {
  const response = await fetch(centerUsersMeUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ` + accessToken,
      'Content-Type': 'application/json',
    },
  });
  console.log('[knowledge-base] user fetched');
  const data: { id: string; iam2ID: string } = await response.json();
  return data;
};

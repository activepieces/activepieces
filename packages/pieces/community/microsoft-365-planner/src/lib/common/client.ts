import { Client } from '@microsoft/microsoft-graph-client';

import type { Microsoft365PlannerAuthValue } from './types';

function baseUrl({ auth }: { auth: Microsoft365PlannerAuthValue }): string {
  const host = auth.props?.cloud ?? COMMERCIAL_LOGIN_HOST;
  return GRAPH_BASE_URLS[host] ?? GRAPH_BASE_URLS[COMMERCIAL_LOGIN_HOST];
}

function create({ auth }: { auth: Microsoft365PlannerAuthValue }): Client {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        return auth.access_token;
      },
    },
    baseUrl: baseUrl({ auth }),
  });
}

export const microsoft365PlannerClient = { baseUrl, create };

const COMMERCIAL_LOGIN_HOST = 'login.microsoftonline.com';

const GRAPH_BASE_URLS: Record<string, string> = {
  [COMMERCIAL_LOGIN_HOST]: 'https://graph.microsoft.com',
  'login.microsoftonline.us': 'https://graph.microsoft.us',
};

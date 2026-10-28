import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

import type { OutlookCalendarAuthValue } from './types';

function baseUrl({ auth }: { auth: OutlookCalendarAuthValue }): string {
  const host = auth.props?.cloud ?? COMMERCIAL_LOGIN_HOST;
  const graphUrl = GRAPH_BASE_URLS[host] ?? GRAPH_BASE_URLS[COMMERCIAL_LOGIN_HOST];
  return `${graphUrl}/v1.0/me`;
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: RequestParams & { auth: OutlookCalendarAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl({ auth })}${path}`,
    queryParams: query,
    body,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });
  return response.body;
}

export const outlookCalendarClient = { baseUrl, request };

const COMMERCIAL_LOGIN_HOST = 'login.microsoftonline.com';

const GRAPH_BASE_URLS: Record<string, string> = {
  [COMMERCIAL_LOGIN_HOST]: 'https://graph.microsoft.com',
  'login.microsoftonline.us': 'https://graph.microsoft.us',
};

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
};

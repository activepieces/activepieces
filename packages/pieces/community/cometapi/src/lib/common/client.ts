import {
  AuthenticationType,
  httpClient,
  HttpHeaders,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import type { CometApiAuthValue } from './types';

function baseUrl(): string {
  return HOSTS.v1;
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
  headers,
  host = 'v1',
  responseType,
}: RequestParams & { auth: CometApiAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${HOSTS[host]}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    queryParams: query,
    body,
    headers,
    responseType,
  });
  return response.body;
}

export const cometApiClient = { baseUrl, request };

const HOSTS = {
  v1: 'https://api.cometapi.com/v1',
  root: 'https://api.cometapi.com',
};

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: HttpHeaders;
  host?: keyof typeof HOSTS;
  responseType?: 'arraybuffer' | 'json';
};

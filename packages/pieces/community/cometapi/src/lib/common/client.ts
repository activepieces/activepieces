import {
  AuthenticationType,
  httpClient,
  HttpHeaders,
  HttpMethod,
} from '@activepieces/pieces-common';
import type { CometApiAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.cometapi.com/v1';
}

async function request<T>({
  auth,
  method,
  path,
  body,
  headers,
}: RequestParams & { auth: CometApiAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    body,
    headers,
  });
  return response.body;
}

export const cometApiClient = { baseUrl, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  body?: unknown;
  headers?: HttpHeaders;
};

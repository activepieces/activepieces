import { HttpHeaders, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';

import type { RaindropAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.raindrop.io/rest/v1';
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
  headers,
  timeout,
  responseType,
}: RequestParams & { auth: RaindropAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    headers: { Authorization: `Bearer ${auth.access_token}`, ...headers },
    queryParams: query,
    body,
    timeout,
    responseType,
  });
  return response.body;
}

export const raindropClient = { baseUrl, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: HttpHeaders;
  timeout?: number;
  responseType?: 'arraybuffer' | 'json';
};

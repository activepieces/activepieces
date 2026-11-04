import {
  HttpHeaders,
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import type { ParseurAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.parseur.com';
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
  headers,
}: RequestParams & { auth: ParseurAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    headers: {
      Authorization: auth.secret_text,
      'Content-Type': 'application/json',
      ...headers,
    },
    queryParams: query,
    body,
  });
  return response.body;
}

export const parseurClient = { baseUrl, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: HttpHeaders;
};

import {
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import type { TelnyxAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.telnyx.com/v2';
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: RequestParams & { auth: TelnyxAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    headers: {
      Authorization: `Bearer ${auth.secret_text}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    queryParams: query,
    body,
  });

  return response.body;
}

export const telnyxClient = { baseUrl, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: Record<string, unknown>;
};

import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import type { TelnyxAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.telnyx.com/v2';
}

async function request<T>({
  auth,
  method,
  path,
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
    body,
  });

  return response.body;
}

export const telnyxClient = { baseUrl, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
};

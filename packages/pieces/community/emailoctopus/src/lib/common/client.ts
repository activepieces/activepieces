import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import type { EmailOctopusAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.emailoctopus.com';
}

async function request<T>({
  auth,
  method,
  path,
  body,
}: RequestParams & { auth: EmailOctopusAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    body,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.secret_text}`,
    },
  });
  return response.body;
}

export const emailOctopusClient = { baseUrl, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  body?: object;
};

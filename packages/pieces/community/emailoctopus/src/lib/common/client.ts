import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import type { EmailOctopusAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.emailoctopus.com';
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: RequestParams & { auth: EmailOctopusAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    queryParams: query,
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
  query?: QueryParams;
  body?: object;
};

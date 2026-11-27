import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import type { BeamerAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.getbeamer.com/v0';
}

async function request<T>({ auth, method, path, body }: RequestParams & { auth: BeamerAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    headers: {
      'Beamer-Api-Key': `${auth.secret_text}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body,
  });
  return response.body;
}

export const beamerClient = { baseUrl, request };

type RequestParams = { method: HttpMethod; path: string; body?: Record<string, unknown> };

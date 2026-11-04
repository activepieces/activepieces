import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import type { MillionVerifierAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.millionverifier.com/api/v3';
}

async function request<T>({ auth, method, path, query }: RequestParams & { auth: MillionVerifierAuthValue }): Promise<T> {
  const params = new URLSearchParams({ api: auth.secret_text, ...query });
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}?${params.toString()}`,
  });
  return response.body;
}

export const millionVerifierClient = { baseUrl, request };

type RequestParams = { method: HttpMethod; path: string; query?: Record<string, string> };

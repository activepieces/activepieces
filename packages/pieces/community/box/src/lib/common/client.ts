import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import type { BoxAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.box.com/2.0';
}

async function request<T>({ auth, method, path, body }: RequestParams & { auth: BoxAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    body,
  });
  return response.body;
}

export const boxClient = { baseUrl, request };

type RequestParams = { method: HttpMethod; path: string; body?: Record<string, unknown> };

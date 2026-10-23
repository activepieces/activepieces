import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import type { AgentxAuthValue } from './types';

function baseUrl(): string {
  return BASE_URL;
}

async function request<T>({ auth, method, path, body, headers }: RequestParams & { auth: AgentxAuthValue }): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${baseUrl()}${path}`,
      headers: {
        'x-api-key': auth.secret_text,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body,
    });
    return response.body;
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : String(error);
    throw new Error(`AgentX API error: ${message}`);
  }
}

export const agentxClient = { baseUrl, request };

const BASE_URL = 'https://api.agentx.so/api/v1';

type RequestParams = {
  method: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

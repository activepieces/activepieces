import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.chataid.com`;

export async function makeRequest(
  api_key: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const headers: Record<string, string> = {
      Authorization: `${api_key}`,
    };

    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers,
      body,
    });
    return response.body;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Unexpected error: ${errorMessage}`);
  }
}

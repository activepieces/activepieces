import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const chatlingCommon = {
  baseUrl: 'https://api.chatling.ai/v2',
};

export async function makeRequest<T = unknown>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${chatlingCommon.baseUrl}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}


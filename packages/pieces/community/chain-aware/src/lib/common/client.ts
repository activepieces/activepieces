import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://enterprise.api.chainaware.ai';

export async function makeRequest<T>(request: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: request.method,
    url: `${BASE_URL}${request.path}`,
    headers: {
      'x-api-key': request.apiKey,
      'Content-Type': 'application/json',
    },
    body: request.body,
  });

  return response.body;
}

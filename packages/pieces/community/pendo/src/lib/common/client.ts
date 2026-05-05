import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://app.pendo.io/api/v1';

export async function pendoRequest<T>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'x-pendo-integration-key': apiKey,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.pandadoc.com/public/v1';

export async function makeRequest(auth: string, method: HttpMethod, path: string, body?: unknown, queryParams?: Record<string, string>) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'Authorization': `API-Key ${auth}`,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
  return response.body;
}

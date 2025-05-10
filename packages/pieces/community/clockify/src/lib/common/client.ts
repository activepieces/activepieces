import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.clockify.me/api/v1';

export async function makeRequest(auth: string, method: HttpMethod, path: string, body?: unknown) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'X-Api-Key': `${auth}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

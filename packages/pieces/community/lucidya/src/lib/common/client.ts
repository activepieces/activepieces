import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.lucidya.com';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  queryParams?: Record<string, string>,
  body?: unknown
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'luc-authorization': apiKey,
      'Content-Type': 'application/json',
    },
    queryParams,
    body,
  });
  return response.body;
}

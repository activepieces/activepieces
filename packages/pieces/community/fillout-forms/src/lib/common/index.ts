import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.fillout.com/v1/api';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });

  return response.body;
}

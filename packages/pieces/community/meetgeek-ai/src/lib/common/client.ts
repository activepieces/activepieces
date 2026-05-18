import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const MEETGEEKAI_BASE_URL = 'https://api.meetgeek.ai/v1';

export async function makeRequest(
  api_key: string,
  method: HttpMethod,
  url: string,
  body?: any
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${MEETGEEKAI_BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${api_key}`,
    },
    body,
  });
  return response.body;
}

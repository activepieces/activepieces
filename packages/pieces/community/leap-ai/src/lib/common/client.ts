import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.workflows.tryleap.ai/v2';

export async function makeRequest(
  auth: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const url = `${BASE_URL}${path}`;

  const response = await httpClient.sendRequest({
    method,
    url,
    headers: {
      'X-Api-Key': auth,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}

import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.transmitsms.com';

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
      'x-api-key': auth,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}

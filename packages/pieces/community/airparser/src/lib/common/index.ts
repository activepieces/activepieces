import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const url = `https://api.airparser.com${path}`;

  const response = await httpClient.sendRequest({
    method,
    url,
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}

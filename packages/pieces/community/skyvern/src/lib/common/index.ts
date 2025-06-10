import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface SkyvernAuth {
  apiKey: string;
}

export async function makeRequest(
  auth: SkyvernAuth,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const url = `https://api.skyvern.com/v1${path}`;

  const response = await httpClient.sendRequest({
    method,
    url,
    headers: {
      'x-api-key': auth.apiKey,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}

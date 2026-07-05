import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.tunova.ai';

/** Thin wrapper around the public Tunova REST API. The API key is sent as the `X-API-Key` header. */
export async function tunovaRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

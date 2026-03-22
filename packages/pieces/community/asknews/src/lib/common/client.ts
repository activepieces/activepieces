import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.asknews.app/v1';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

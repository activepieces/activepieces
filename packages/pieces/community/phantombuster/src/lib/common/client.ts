import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.phantombuster.com/api/v2`;

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
        'X-Phantombuster-Key-1': `${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

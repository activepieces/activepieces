import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.magicslides.app/public/api`;

export async function makeRequest(
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Unexpected error: ${error.message}`);
    }
    throw new Error('API call failed: Unknown error');
  }
}

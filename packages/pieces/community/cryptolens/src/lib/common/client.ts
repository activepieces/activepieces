import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.cryptolens.io/api`;

export async function makeRequest(
  access_token: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const url = `${BASE_URL}${path}?token=${encodeURIComponent(access_token)}`;

    const response = await httpClient.sendRequest({
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

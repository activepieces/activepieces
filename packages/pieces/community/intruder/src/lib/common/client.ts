import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.intruder.io/v1`;

export async function makeRequest(
  access_token: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const url = `${BASE_URL}${path}`;
    const response = await httpClient.sendRequest({
      method,
      url,
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

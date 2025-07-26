import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.focus.teamleader.eu`;

export async function makeRequest(
  access_token: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string> | string
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
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

import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = `https://api.getvero.com/api/v2`;

export async function makeRequest<T>(
  auth_token: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}?auth_token=${auth_token}`,
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

import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://l7api.com/v1.2/voipstudio`;

export async function makeRequest<T>(
  auth_token: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'X-Auth-Token': auth_token,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

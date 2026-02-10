import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.zeplin.dev/v1`;

export async function makeRequest<T>(
  access_token: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

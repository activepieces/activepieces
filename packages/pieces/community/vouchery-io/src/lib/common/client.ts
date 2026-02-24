import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = `https://admin.sandbox.vouchery.app/api/v2.1`;

export async function makeRequest<T>(
  api_key: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${api_key}`,
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

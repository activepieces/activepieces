import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.octopush.com/v1/public`;

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
      headers: {},
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

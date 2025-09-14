import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.slidespeak.co/api/v1`;

export async function makeRequest(
  api_key: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
) {
  try {
    // Detect if body is FormData
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const headers: Record<string, string> = {
      'X-API-Key': api_key,
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers,
      body,
    });

    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

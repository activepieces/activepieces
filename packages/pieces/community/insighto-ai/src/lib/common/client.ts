import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.insighto.ai/api/v1`;

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  query?: Record<string, string | number | boolean>
) {
  try {
    // Always inject api_key in query params
    const params = new URLSearchParams({
      api_key: apiKey,
      ...(query || {}),
    });

    const url = `${BASE_URL}${path}?${params.toString()}`;

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
    throw new Error(
      `Unexpected error: ${error.message || String(error)}`
    );
  }
}

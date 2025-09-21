import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.capsulecrm.com/api/v2`;

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  query?: Record<string, string | number | boolean>
) {
  try {
    const queryParams =
      query &&
      Object.fromEntries(
        Object.entries(query).map(([k, v]) => [k, String(v)])
      );

    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
      queryParams, 
    });

    return response.body;
  } catch (error: any) {
    throw new Error(`Capsule API error: ${error.message || String(error)}`);
  }
}

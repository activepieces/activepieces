import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.paywhirl.com`;

export async function makeRequest(
  apikey: string,
  apisecret: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'api-key': apikey,
        'api-secret': apisecret,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

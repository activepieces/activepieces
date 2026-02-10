import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { phantombusterAuth } from './auth';

export const BASE_URL = `https://api.phantombuster.com/api/v2`;

export async function makeRequest(
  apiKey: AppConnectionValueForAuthProperty<typeof phantombusterAuth>,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    console.log( `${BASE_URL}${path}`)
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'X-Phantombuster-Key': `${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

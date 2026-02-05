import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { writesonicBulkAuth } from './auth';

export const BASE_URL = `https://api.writesonic.com/v2/business`;

export async function makeRequest(
  api_key: AppConnectionValueForAuthProperty<typeof writesonicBulkAuth>,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'X-API-KEY': `${api_key.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

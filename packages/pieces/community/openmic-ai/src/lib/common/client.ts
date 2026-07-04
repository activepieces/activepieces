import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { openmicAiAuth } from './auth';

export const BASE_URL = `https://api.openmic.ai/v1`;

export async function makeRequest(
  api_key: AppConnectionValueForAuthProperty<typeof openmicAiAuth>,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${api_key.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

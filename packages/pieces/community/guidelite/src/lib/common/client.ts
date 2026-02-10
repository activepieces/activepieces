import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { guideliteAuth } from '../common/auth';

export const BASE_URL = `https://api.guidelite.ai/external-api/v1`;

export async function makeRequest(
  {secret_text}: AppConnectionValueForAuthProperty<typeof guideliteAuth>,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        authorization: `Bearer ${secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

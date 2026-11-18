import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL, exaApi } from './client';

export async function makeRequest(auth: string, method: HttpMethod, path: string, body?: unknown) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'x-api-key': `${auth}`,
        'Content-Type': 'application/json',
      },
      body,
      followRedirects: false,
    });

    return exaApi.bodyOf(response);
  } catch (error) {
    throw exaApi.toError(error);
  }
}

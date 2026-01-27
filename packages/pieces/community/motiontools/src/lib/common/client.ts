import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.motiontools.io/api';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: any
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'api-key': apiKey,
      },
      body: body,
    });

    return response.body;
  } catch (error: any) {
    throw new Error(
      `Unexpected error: ${JSON.stringify(
        error.response || error.message || error
      )}`
    );
  }
}

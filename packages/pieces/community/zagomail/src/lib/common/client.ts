import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.zagomail.com';

export async function makeRequest(auth: string, method: HttpMethod, path: string, body?: unknown) {
  let requestBody: Record<string, unknown> = {};

  // Always include the publicKey in the request body
  requestBody['publicKey'] = auth;

    // Add body properties to requestBody if body exists and is an object
    if (body && typeof body === 'object') {
      requestBody = {
        ...requestBody,
        ...body as Record<string, unknown>,
      };
    }

  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });
  return response.body;
}

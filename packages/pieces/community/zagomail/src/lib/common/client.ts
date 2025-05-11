import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.zagomail.com';

export async function makeRequest(auth: string, method: HttpMethod, path: string, body?: unknown) {
  let requestBody: Record<string, unknown> | undefined;

  if (method !== HttpMethod.GET) {
    requestBody = {
      publicKey: auth,
    };

    // Add body properties to requestBody if body exists and is an object
    if (body && typeof body === 'object') {
      requestBody = {
        ...requestBody,
        ...body as Record<string, unknown>,
      };
    }
  }

  const url = method === HttpMethod.GET
    ? `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}publicKey=${auth}`
    : `${BASE_URL}${path}`;

  const response = await httpClient.sendRequest({
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });
  return response.body;
}

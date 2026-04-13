import { httpClient, HttpMethod, HttpResponse } from '@activepieces/pieces-common';

export const BASE_URL = 'https://proxy.whatsscale.com';

export async function whatsscaleClient(
  auth: string,
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
): Promise<HttpResponse> {
  return httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'X-Api-Key': auth,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
}

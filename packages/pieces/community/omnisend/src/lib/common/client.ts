import { httpClient, HttpMethod, HttpMessageBody } from '@activepieces/pieces-common';

export const OMNISEND_API_BASE = 'https://api.omnisend.com/v5';

export async function omnisendRequest<T extends HttpMessageBody>(
  method: HttpMethod,
  path: string,
  apiKey: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${OMNISEND_API_BASE}${path}`,
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body,
    queryParams,
  });
  return response.body;
}

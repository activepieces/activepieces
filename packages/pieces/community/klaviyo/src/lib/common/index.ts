import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
export const KLAVIYO_REVISION = '2024-10-15';

export async function klaviyoApiCall<T>(
  apiKey: string,
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  queryParams?: Record<string, string>,
): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${KLAVIYO_API_BASE}${endpoint}`,
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      accept: 'application/json',
      'content-type': 'application/json',
      revision: KLAVIYO_REVISION,
    },
    body,
    queryParams,
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

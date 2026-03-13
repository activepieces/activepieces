import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const KLAVIYO_BASE_URL = 'https://a.klaviyo.com/api';
export const KLAVIYO_API_REVISION = '2023-02-22';

export function klaviyoHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    revision: KLAVIYO_API_REVISION,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export async function klaviyoApiCall<T>(params: {
  method: HttpMethod;
  apiKey: string;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: params.method,
    url: `${KLAVIYO_BASE_URL}${params.path}`,
    headers: klaviyoHeaders(params.apiKey),
    body: params.body,
    queryParams: params.queryParams,
  });
  return response.body;
}

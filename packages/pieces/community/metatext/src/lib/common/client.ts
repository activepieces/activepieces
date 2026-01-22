import {
  HttpMethod,
  httpClient,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export const METATEXT_API_URL = 'https://api.metatext.ai';
export const METATEXT_GUARD_URL = 'https://guard-api.metatext.ai';

export type AuthType = 'bearer' | 'x-api-key';

export type MetatextApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  baseUrl?: string;
  authType?: AuthType;
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
};

export async function metatextApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  endpoint,
  baseUrl = METATEXT_API_URL,
  authType = 'x-api-key',
  query,
  body,
}: MetatextApiCallParams): Promise<T> {
  const qs: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  const headers: Record<string, string> =
    authType === 'bearer'
      ? {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      : {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        };

  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}${endpoint}`,
    headers,
    queryParams: qs,
    body,
  });

  return response.body;
}

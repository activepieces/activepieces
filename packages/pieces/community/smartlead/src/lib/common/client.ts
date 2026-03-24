import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../auth';

export const BASE_URL = 'https://server.smartlead.ai/api/v1';

export async function smartleadRequest<T = Record<string, unknown>>({
  endpoint,
  method,
  apiKey,
  body,
  queryParams = {},
}: {
  endpoint: string;
  method: HttpMethod;
  apiKey: AppConnectionValueForAuthProperty<typeof smartleadAuth>;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string | number | boolean>;
}): Promise<T> {
  const url = `${BASE_URL}/${endpoint}`;

  const allParams: Record<string, string> = {
    api_key: apiKey.secret_text,
  };

  for (const [k, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      allParams[k] = String(value);
    }
  }

  const queryString = Object.entries(allParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const finalUrl = `${url}?${queryString}`;

  const response = await httpClient.sendRequest({
    method,
    url: finalUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body as T;
}

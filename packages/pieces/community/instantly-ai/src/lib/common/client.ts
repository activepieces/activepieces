import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { instantlyAiAuth } from '../..';

export const BASE_URL = 'https://api.instantly.ai/api/v2';

export async function makeRequest({
  endpoint,
  method,
  apiKey,
  body,
  queryParams = {},
}: {
  endpoint: string;
  method: HttpMethod;
  apiKey: AppConnectionValueForAuthProperty<typeof instantlyAiAuth>;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string | number | boolean>;
}) {
  const url = `${BASE_URL}/${endpoint}`;

  const queryString = Object.entries(queryParams)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  const finalUrl = queryString ? `${url}?${queryString}` : url;

  const response = await httpClient.sendRequest({
    method,
    url: finalUrl,
    headers: {
      'Content-Type': 'application/json',
      'authorization': `Bearer ${apiKey.secret_text}`,
    },
    body,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `Instantly API returned an error: ${response.status} ${
        response.body?.message || JSON.stringify(response.body)
      }`
    );
  }

  return response.body;
}

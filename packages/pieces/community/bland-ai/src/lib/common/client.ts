import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BLAND_AI_BASE_URL } from '../auth';

export async function blandApiCall<T>(params: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: params.method,
    url: `${BLAND_AI_BASE_URL}${params.path}`,
    headers: {
      authorization: params.apiKey,
      'Content-Type': 'application/json',
    },
    body: params.body,
    queryParams: params.query,
  });
  return response.body;
}

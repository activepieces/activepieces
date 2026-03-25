import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BLAND_AI_BASE_URL, blandHeaders } from '../auth';

export async function blandApiCall<T>(params: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string | undefined>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: params.method,
    url: `${BLAND_AI_BASE_URL}${params.path}`,
    headers: blandHeaders(params.apiKey),
    body: params.body,
    queryParams: params.query,
  });
  return response.body;
}

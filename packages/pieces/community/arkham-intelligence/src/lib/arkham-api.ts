import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.arkhamintelligence.com';

export async function arkhamApiCall<T = unknown>({
  apiKey,
  endpoint,
  method,
  queryParams,
  body,
}: {
  apiKey: string;
  endpoint: string;
  method: HttpMethod;
  queryParams?: QueryParams;
  body?: unknown;
}): Promise<T> {
  const request: HttpRequest = {
    url: `${BASE_URL}${endpoint}`,
    method,
    headers: {
      'API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    queryParams: queryParams ?? {},
    body: body as Record<string, unknown> | undefined,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

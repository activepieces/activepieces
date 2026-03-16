import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DUNE_API_BASE = 'https://api.dune.com/api/v1';

export async function duneRequest<T>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${DUNE_API_BASE}${path}`,
    headers: {
      'X-Dune-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
  return response.body;
}

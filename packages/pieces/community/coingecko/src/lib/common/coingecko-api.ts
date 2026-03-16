import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export async function coingeckoRequest<T>(
  apiKey: string | undefined,
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${COINGECKO_API_BASE}${path}`,
    queryParams: params,
    headers,
  });

  return response.body;
}

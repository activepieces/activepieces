import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function fetchDefiLlama<T>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: DEFILLAMA_BASE + endpoint,
    headers: {
      Accept: 'application/json',
    },
  });
  return response.body;
}

export async function fetchCoinGecko<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  let url = COINGECKO_BASE + endpoint;
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString();
    url = url + '?' + query;
  }
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url,
    headers: {
      Accept: 'application/json',
    },
  });
  return response.body;
}

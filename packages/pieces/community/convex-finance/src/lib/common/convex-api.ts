import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
export const CURVE_API_BASE_URL = 'https://api.curve.fi/v1';
export const CONVEX_API_BASE_URL = 'https://www.convexfinance.com/api';

export async function convexRequest<T>(url: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}

export const NETWORK_OPTIONS = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
  { label: 'Polygon', value: 'polygon' },
];

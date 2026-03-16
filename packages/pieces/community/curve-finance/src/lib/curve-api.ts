import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.curve.fi/v1';

export async function curveRequest<T>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${BASE_URL}${endpoint}`,
    headers: { 'Accept': 'application/json' },
  });
  return response.body;
}

export const CHAIN_OPTIONS = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Base', value: 'base' },
  { label: 'Avalanche', value: 'avalanche' },
  { label: 'Fantom', value: 'fantom' },
  { label: 'xDai/Gnosis', value: 'xdai' },
];

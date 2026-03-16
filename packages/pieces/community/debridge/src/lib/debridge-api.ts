import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFIILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function debridgeRequest(
  path: string,
  base: 'defiillama' | 'coingecko' = 'defiillama'
): Promise<any> {
  const baseUrl = base === 'defiillama' ? DEFIILLAMA_BASE : COINGECKO_BASE;
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${baseUrl}${path}`,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}

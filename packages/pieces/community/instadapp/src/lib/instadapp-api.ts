import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE = 'https://api.llama.fi';
export const DEFILLAMA_YIELDS_BASE = 'https://yields.llama.fi';
export const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function makeRequest(path: string, base = DEFILLAMA_BASE) {
  const res = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${base}${path}`,
  });
  return res.body;
}

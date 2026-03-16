import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function makeRequest(path: string, base = DEFILLAMA_BASE) {
  const res = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${base}${path}`,
  });
  return res.body;
}

export { DEFILLAMA_BASE, COINGECKO_BASE };

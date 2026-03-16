import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const PROTOCOL_SLUG = 'spookyswap';

export async function getProtocolData() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/${PROTOCOL_SLUG}`,
  });
  return response.body;
}

export async function getTokenPrice() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/simple/price`,
    queryParams: {
      ids: 'spookyswap',
      vs_currencies: 'usd,btc',
      include_24hr_change: 'true',
    },
  });
  return response.body;
}

import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function getProtocolData() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/camelot-dex`,
  });
  return response.body;
}

export async function getGrailPrice() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/simple/price?ids=grail&vs_currencies=usd,btc&include_24hr_change=true`,
  });
  return response.body;
}

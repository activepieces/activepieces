import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function getAxelarProtocol() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/axelar`,
  });
  return response.body;
}

export async function getCoinGeckoAxelar() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/coins/axelar?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
  });
  return response.body;
}

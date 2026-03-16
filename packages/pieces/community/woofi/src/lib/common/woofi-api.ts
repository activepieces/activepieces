import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function getWoofiProtocol(): Promise<any> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://api.llama.fi/protocol/woofi',
  });
  return response.body;
}

export async function getWooTokenPrice(): Promise<any> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=woo-network&vs_currencies=usd,btc&include_24hr_change=true',
  });
  return response.body;
}

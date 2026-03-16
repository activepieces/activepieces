import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function getSolidlyProtocol(): Promise<any> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://api.llama.fi/protocol/solidly-v3',
  });
  return response.body;
}

export async function getSolidTokenPrice(): Promise<any> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=solid&vs_currencies=usd,btc&include_24hr_change=true',
  });
  return response.body;
}

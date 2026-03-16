import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function getBeethovenProtocol(): Promise<any> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://api.llama.fi/protocol/beethoven-x',
  });
  return response.body;
}

export async function getBeetsTokenPrice(): Promise<any> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=beethoven-x&vs_currencies=usd,btc&include_24hr_change=true',
  });
  return response.body;
}

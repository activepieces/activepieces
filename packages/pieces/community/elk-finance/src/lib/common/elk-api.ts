import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function getElkProtocol(): Promise<any> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://api.llama.fi/protocol/elk-finance',
  });
  return response.body;
}

export async function getElkTokenPrice(): Promise<any> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=elk-finance&vs_currencies=usd,btc&include_24hr_change=true',
  });
  return response.body;
}

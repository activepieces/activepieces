import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current Total Value Locked (TVL) data for Alpaca Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/alpaca-finance',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      tvl: data['currentChainTvls'],
      totalTvl: data['tvl'],
      slug: data['slug'],
      symbol: data['symbol'],
      chain: data['chain'],
      chains: data['chains'],
      category: data['category'],
      url: data['url'],
    };
  },
});

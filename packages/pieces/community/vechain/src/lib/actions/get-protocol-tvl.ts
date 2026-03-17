import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for VeChain from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/vechain',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      description: data['description'],
      tvl: data['tvl'],
      currentChainTvls: data['currentChainTvls'],
      chainTvls: data['chainTvls'],
      category: data['category'],
      chains: data['chains'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});

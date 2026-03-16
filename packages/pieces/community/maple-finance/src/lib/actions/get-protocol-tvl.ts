import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for Maple Finance across all pools via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/maple',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      currentChainTvls: data['currentChainTvls'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      category: data['category'],
      chains: data['chains'],
    };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current total value locked (TVL) for Astar Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/astar',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['currentChainTvls'],
      totalTvl: data['tvl'],
      chains: data['chains'],
      category: data['category'],
      description: data['description'],
    };
  },
});

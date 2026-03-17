import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Retrieve the current Total Value Locked (TVL) for CoW Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/cow-protocol',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      tvl: data['currentChainTvls'],
      totalTvl: data['tvl'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});
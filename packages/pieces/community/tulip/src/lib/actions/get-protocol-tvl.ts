import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Tulip Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/tulip',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      tvl: data['tvl'],
      currentChainTvls: data['currentChainTvls'],
      category: data['category'],
      chain: data['chain'],
      chains: data['chains'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});

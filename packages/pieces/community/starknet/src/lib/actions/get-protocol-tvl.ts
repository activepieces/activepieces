import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvlAction = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for StarkNet from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/starknet',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      tvl: data['tvl'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});

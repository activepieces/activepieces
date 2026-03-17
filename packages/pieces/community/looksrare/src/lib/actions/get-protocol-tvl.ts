import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for LooksRare from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/looksrare',
    });

    const data = response.body;
    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['currentChainTvls'],
      totalTvl: data['tvl'],
      category: data['category'],
      chains: data['chains'],
      url: data['url'],
      twitter: data['twitter'],
      description: data['description'],
    };
  },
});

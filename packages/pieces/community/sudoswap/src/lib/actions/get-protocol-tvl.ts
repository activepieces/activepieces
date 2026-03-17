import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'getProtocolTvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the Sudoswap protocol via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sudoswap',
    });

    const data = response.body;
    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      currentChainTvls: data['currentChainTvls'],
      category: data['category'],
      chains: data['chains'],
      url: data['url'],
      description: data['description'],
      twitter: data['twitter'],
    };
  },
});

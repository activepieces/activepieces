import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the Manta Network protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/manta',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      currentChainTvls: data['currentChainTvls'],
      category: data['category'],
      chains: data['chains'],
      slug: data['slug'],
      url: data['url'],
      twitter: data['twitter'],
      description: data['description'],
    };
  },
});

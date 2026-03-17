import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the total value locked (TVL) for the Hedera protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/hedera',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      slug: data['slug'],
      tvl: data['tvl'],
      chainTvls: data['chainTvls'],
      category: data['category'],
      chains: data['chains'],
      symbol: data['symbol'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});

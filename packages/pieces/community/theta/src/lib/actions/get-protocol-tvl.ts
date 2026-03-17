import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for Theta Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/theta',
    });

    const data = response.body;
    return {
      name: data['name'],
      slug: data['slug'],
      tvl: data['tvl'],
      chainTvls: data['chainTvls'],
      currentChainTvls: data['currentChainTvls'],
      description: data['description'],
      symbol: data['symbol'],
      url: data['url'],
    };
  },
});

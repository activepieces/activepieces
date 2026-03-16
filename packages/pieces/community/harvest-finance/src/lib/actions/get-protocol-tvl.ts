import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get the current Total Value Locked (TVL) for Harvest Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/harvest-finance',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      tvl: data['tvl'],
      chainTvls: data['chainTvls'],
      category: data['category'],
      symbol: data['symbol'],
      url: data['url'],
    };
  },
});

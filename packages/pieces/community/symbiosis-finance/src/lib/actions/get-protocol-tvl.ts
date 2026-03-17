import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Symbiosis Finance total value locked across all chains from DeFiLlama',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/symbiosis-finance',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      tvl: data['tvl'],
      chainTvls: data['chainTvls'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      description: data['description'],
    };
  },
});

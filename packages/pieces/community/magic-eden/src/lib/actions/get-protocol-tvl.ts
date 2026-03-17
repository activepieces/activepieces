import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetches the current Total Value Locked (TVL) for the Magic Eden protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/magic-eden',
    });

    const data = response.body;

    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      chainTvls: data['chainTvls'],
      currentChainTvls: data['currentChainTvls'],
      category: data['category'],
      chains: data['chains'],
      url: data['url'],
      description: data['description'],
    };
  },
});

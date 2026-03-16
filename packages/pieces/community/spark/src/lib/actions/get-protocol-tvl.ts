import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current total value locked (TVL) in Spark Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/spark',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      tvl: data['currentChainTvls'],
      totalTvl: data['tvl'],
      symbol: data['symbol'],
      chain: data['chain'],
      chains: data['chains'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
    };
  },
});

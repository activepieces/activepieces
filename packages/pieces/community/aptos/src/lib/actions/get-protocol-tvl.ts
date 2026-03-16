import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Retrieve the current Total Value Locked (TVL) for the Aptos protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/aptos',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      currentTvl: Array.isArray(data['tvl'])
        ? (data['tvl'] as { totalLiquidityUSD: number }[]).slice(-1)[0]?.totalLiquidityUSD
        : null,
      chainTvls: data['chainTvls'],
      category: data['category'],
      chains: data['chains'],
      description: data['description'],
      url: data['url'],
    };
  },
});

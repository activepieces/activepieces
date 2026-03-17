import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get the current Total Value Locked (TVL) for Ankr Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ankr',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;
    const latestTvl = tvlHistory && tvlHistory.length > 0
      ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
      : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: latestTvl,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      category: data['category'],
      chains: data['chains'],
    };
  },
});

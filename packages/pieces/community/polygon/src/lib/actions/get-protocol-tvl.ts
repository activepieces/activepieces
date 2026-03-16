import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the Polygon protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/polygon',
    });
    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const currentTvl =
      Array.isArray(tvlHistory) && tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
        : null;
    return {
      name: data['name'],
      symbol: data['symbol'],
      current_tvl_usd: currentTvl,
      currentChainTvls: data['currentChainTvls'],
      category: data['category'],
      chains: data['chains'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for Moonbeam including TVL, category, chains, and description from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/moonbeam',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    const latestTvl =
      tvlArray && tvlArray.length > 0
        ? tvlArray[tvlArray.length - 1]?.totalLiquidityUSD
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: Array.isArray(data['chains']) ? (data['chains'] as string[]).length : 0,
      current_tvl_usd: latestTvl,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});

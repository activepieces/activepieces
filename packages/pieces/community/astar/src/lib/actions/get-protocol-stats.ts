import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Astar Network including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/astar',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const totalTvl = currentChainTvls
      ? Object.values(currentChainTvls).reduce((sum, v) => sum + v, 0)
      : 0;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latestTvl = tvlHistory && tvlHistory.length > 0
      ? tvlHistory[tvlHistory.length - 1]?.totalLiquidityUSD
      : null;
    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      total_chains: Array.isArray(data['chains']) ? (data['chains'] as string[]).length : 0,
      current_tvl_usd: totalTvl,
      latest_historical_tvl: latestTvl,
      slug: data['slug'],
      twitter: data['twitter'],
      url: data['url'],
    };
  },
});

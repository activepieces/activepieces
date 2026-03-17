import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Nano from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/nano',
    });
    const data = response.body as Record<string, unknown>;
    const tvlHistory = (data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>) ?? [];
    const currentTvl =
      tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1]?.totalLiquidityUSD ?? 0
        : 0;
    const tvl30dAgo =
      tvlHistory.length > 30
        ? tvlHistory[tvlHistory.length - 31]?.totalLiquidityUSD ?? 0
        : 0;
    const change30d =
      tvl30dAgo > 0 ? ((currentTvl - tvl30dAgo) / tvl30dAgo) * 100 : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      description: data['description'],
      category: data['category'],
      chains: data['chains'],
      tvl_usd: currentTvl,
      tvl_change_30d_percent: change30d !== null ? parseFloat(change30d.toFixed(2)) : null,
      currentChainTvls: data['currentChainTvls'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});

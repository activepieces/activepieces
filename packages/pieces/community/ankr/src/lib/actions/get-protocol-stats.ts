import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key statistics and metadata for Ankr Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ankr',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;

    const currentTvl = tvlHistory && tvlHistory.length > 0
      ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
      : null;

    const tvl7dAgo = tvlHistory && tvlHistory.length > 7
      ? tvlHistory[tvlHistory.length - 8].totalLiquidityUSD
      : null;

    const tvl30dAgo = tvlHistory && tvlHistory.length > 30
      ? tvlHistory[tvlHistory.length - 31].totalLiquidityUSD
      : null;

    const change7d = currentTvl && tvl7dAgo
      ? ((currentTvl - tvl7dAgo) / tvl7dAgo) * 100
      : null;

    const change30d = currentTvl && tvl30dAgo
      ? ((currentTvl - tvl30dAgo) / tvl30dAgo) * 100
      : null;

    const chains = data['chains'] as string[];

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      current_tvl_usd: currentTvl,
      change_7d_pct: change7d !== null ? Math.round(change7d * 100) / 100 : null,
      change_30d_pct: change30d !== null ? Math.round(change30d * 100) / 100 : null,
      chain_count: chains ? chains.length : 0,
      chains: chains,
    };
  },
});

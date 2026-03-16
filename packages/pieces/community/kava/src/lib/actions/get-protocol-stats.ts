import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolStatsAction = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key protocol statistics including TVL, chains supported, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kava',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    // Current TVL (latest from history)
    let currentTvl = 0;
    let tvl24hAgo = 0;
    let tvl7dAgo = 0;

    if (tvlHistory && tvlHistory.length > 0) {
      currentTvl = tvlHistory[tvlHistory.length - 1]?.totalLiquidityUSD ?? 0;
      tvl24hAgo = tvlHistory[tvlHistory.length - 2]?.totalLiquidityUSD ?? currentTvl;
      tvl7dAgo = tvlHistory[tvlHistory.length - 8]?.totalLiquidityUSD ?? currentTvl;
    }

    const change24h = tvl24hAgo > 0 ? ((currentTvl - tvl24hAgo) / tvl24hAgo) * 100 : 0;
    const change7d = tvl7dAgo > 0 ? ((currentTvl - tvl7dAgo) / tvl7dAgo) * 100 : 0;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      current_tvl_usd: currentTvl,
      tvl_change_24h_pct: Math.round(change24h * 100) / 100,
      tvl_change_7d_pct: Math.round(change7d * 100) / 100,
      chains_supported: chains ?? [],
      chain_count: (chains ?? []).length,
      chain_tvls: currentChainTvls ?? {},
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key protocol statistics for MultiversX including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/multiversx',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    // Compute 7d and 30d TVL changes
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - 7 * 24 * 60 * 60;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

    let tvl7dAgo = 0;
    let tvl30dAgo = 0;

    if (tvlArray && Array.isArray(tvlArray)) {
      const sorted = [...tvlArray].sort((a, b) => a.date - b.date);
      for (const entry of sorted) {
        if (entry.date <= sevenDaysAgo) tvl7dAgo = entry.totalLiquidityUSD;
        if (entry.date <= thirtyDaysAgo) tvl30dAgo = entry.totalLiquidityUSD;
      }
    }

    const currentTvl =
      currentChainTvls
        ? Object.values(currentChainTvls).reduce((sum: number, v: number) => sum + v, 0)
        : 0;

    const change7d = tvl7dAgo > 0 ? ((currentTvl - tvl7dAgo) / tvl7dAgo) * 100 : null;
    const change30d = tvl30dAgo > 0 ? ((currentTvl - tvl30dAgo) / tvl30dAgo) * 100 : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: Array.isArray(data['chains']) ? (data['chains'] as string[]).length : 0,
      current_tvl_usd: currentTvl,
      current_chain_tvls: currentChainTvls,
      tvl_change_7d_percent: change7d !== null ? Math.round(change7d * 100) / 100 : null,
      tvl_change_30d_percent: change30d !== null ? Math.round(change30d * 100) / 100 : null,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      slug: data['slug'],
    };
  },
});

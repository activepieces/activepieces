import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for LooksRare including TVL, category, chains and more from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/looksrare',
    });

    const data = response.body;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number>;
    const chains = (data['chains'] as string[]) || [];

    const totalTvl = Object.values(currentChainTvls || {}).reduce(
      (sum: number, val: number) => sum + (val || 0),
      0
    );

    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;
    let tvl7dAgo = 0;
    let tvl30dAgo = 0;

    if (tvlHistory && tvlHistory.length > 0) {
      const now = Math.floor(Date.now() / 1000);
      const target7d = now - 7 * 86400;
      const target30d = now - 30 * 86400;

      const entry7d = [...tvlHistory].reverse().find((e) => e.date <= target7d);
      const entry30d = [...tvlHistory].reverse().find((e) => e.date <= target30d);

      tvl7dAgo = entry7d?.totalLiquidityUSD ?? 0;
      tvl30dAgo = entry30d?.totalLiquidityUSD ?? 0;
    }

    const change7d = tvl7dAgo > 0 ? ((totalTvl - tvl7dAgo) / tvl7dAgo) * 100 : null;
    const change30d = tvl30dAgo > 0 ? ((totalTvl - tvl30dAgo) / tvl30dAgo) * 100 : null;

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      current_tvl_usd: totalTvl,
      chain_tvls: currentChainTvls,
      chains,
      chain_count: chains.length,
      tvl_change_7d_pct: change7d !== null ? parseFloat(change7d.toFixed(2)) : null,
      tvl_change_30d_pct: change30d !== null ? parseFloat(change30d.toFixed(2)) : null,
    };
  },
});

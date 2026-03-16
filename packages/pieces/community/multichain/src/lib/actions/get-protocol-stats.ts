import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE_URL, MULTICHAIN_DEFILLAMA_SLUG } from '../common';

export const getProtocolStats = createAction({
  auth: PieceAuth.None(),
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key protocol statistics for Multichain including TVL, chain count, category, and 7-day change via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE_URL}/protocol/${MULTICHAIN_DEFILLAMA_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    const chains = currentChainTvls ? Object.keys(currentChainTvls) : [];
    const totalTvl = currentChainTvls
      ? Object.values(currentChainTvls).reduce((s, v) => s + v, 0)
      : 0;

    let change7d: number | null = null;
    if (tvlHistory && tvlHistory.length >= 8) {
      const recent = tvlHistory[tvlHistory.length - 1];
      const weekAgo = tvlHistory[tvlHistory.length - 8];
      if (recent && weekAgo && weekAgo.totalLiquidityUSD > 0) {
        change7d = parseFloat(
          (((recent.totalLiquidityUSD - weekAgo.totalLiquidityUSD) / weekAgo.totalLiquidityUSD) * 100).toFixed(2)
        );
      }
    }

    const topChains = currentChainTvls
      ? Object.entries(currentChainTvls)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([chain, tvl]) => ({ chain, tvl }))
      : [];

    return {
      name: data['name'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      totalTvlUsd: totalTvl,
      chainCount: chains.length,
      chains,
      topChains,
      change7dPercent: change7d,
      audits: data['audits'],
      audit_links: data['audit_links'],
    };
  },
});

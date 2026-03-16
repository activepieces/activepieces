import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE_URL, ACROSS_DEFILLAMA_SLUG } from '../common';

export const getProtocolStats = createAction({
  auth: PieceAuth.None(),
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Get key Across Protocol statistics including TVL, chain count, 7-day change, and category via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE_URL}/protocol/${ACROSS_DEFILLAMA_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const totalTvl = currentChainTvls
      ? Object.values(currentChainTvls).reduce((sum, v) => sum + v, 0)
      : 0;

    let change7dPct: number | null = null;
    if (tvlArray && tvlArray.length >= 8) {
      const latest = tvlArray[tvlArray.length - 1]?.totalLiquidityUSD ?? 0;
      const weekAgo = tvlArray[tvlArray.length - 8]?.totalLiquidityUSD ?? 0;
      change7dPct = weekAgo > 0 ? parseFloat((((latest - weekAgo) / weekAgo) * 100).toFixed(2)) : null;
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
      currentTvlUsd: totalTvl,
      chainCount: chains?.length ?? 0,
      chains: chains ?? [],
      change7dPct,
      topChains,
      slug: ACROSS_DEFILLAMA_SLUG,
    };
  },
});

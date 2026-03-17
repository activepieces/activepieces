import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getProtocolStats = createAction({
  name: 'getProtocolStats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key Sudoswap protocol statistics including TVL, chains, and category via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sudoswap',
    });

    const data = response.body;
    const tvlHistory = (data['tvl'] as TvlDataPoint[]) || [];
    const currentChainTvls = (data['currentChainTvls'] as Record<string, number>) || {};

    // Calculate current TVL from chain totals
    const currentTvl = Object.values(currentChainTvls).reduce(
      (sum: number, v: number) => sum + v,
      0
    );

    // Get 7d and 30d ago TVL for change %
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - 7 * 24 * 60 * 60;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

    const getClosest = (target: number) => {
      if (tvlHistory.length === 0) return null;
      return tvlHistory.reduce((prev, curr) =>
        Math.abs(curr.date - target) < Math.abs(prev.date - target) ? curr : prev
      );
    };

    const point7d = getClosest(sevenDaysAgo);
    const point30d = getClosest(thirtyDaysAgo);

    const tvlChange7d =
      point7d && point7d.totalLiquidityUSD > 0
        ? ((currentTvl - point7d.totalLiquidityUSD) / point7d.totalLiquidityUSD) * 100
        : null;

    const tvlChange30d =
      point30d && point30d.totalLiquidityUSD > 0
        ? ((currentTvl - point30d.totalLiquidityUSD) / point30d.totalLiquidityUSD) * 100
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      total_chains: ((data['chains'] as string[]) || []).length,
      current_tvl_usd: currentTvl,
      chain_tvls: currentChainTvls,
      tvl_change_7d_percent: tvlChange7d !== null ? Math.round(tvlChange7d * 100) / 100 : null,
      tvl_change_30d_percent: tvlChange30d !== null ? Math.round(tvlChange30d * 100) / 100 : null,
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});

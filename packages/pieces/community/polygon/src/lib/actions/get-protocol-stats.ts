import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key statistics for the Polygon protocol including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/polygon',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as
      | Record<string, number>
      | undefined;
    const tvlHistory = data['tvl'] as
      | Array<{ date: number; totalLiquidityUSD: number }>
      | undefined;

    let tvl7dChange: number | null = null;
    let tvl30dChange: number | null = null;

    if (tvlHistory && Array.isArray(tvlHistory) && tvlHistory.length > 1) {
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - 7 * 24 * 60 * 60;
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
      const currentTvl = tvlHistory[tvlHistory.length - 1].totalLiquidityUSD;

      const entry7d = tvlHistory.find((e) => e.date >= sevenDaysAgo);
      if (entry7d && entry7d.totalLiquidityUSD > 0) {
        tvl7dChange = parseFloat(
          (
            ((currentTvl - entry7d.totalLiquidityUSD) /
              entry7d.totalLiquidityUSD) *
            100
          ).toFixed(2)
        );
      }

      const entry30d = tvlHistory.find((e) => e.date >= thirtyDaysAgo);
      if (entry30d && entry30d.totalLiquidityUSD > 0) {
        tvl30dChange = parseFloat(
          (
            ((currentTvl - entry30d.totalLiquidityUSD) /
              entry30d.totalLiquidityUSD) *
            100
          ).toFixed(2)
        );
      }
    }

    const chainCount = currentChainTvls
      ? Object.keys(currentChainTvls).length
      : 0;
    const tvlCurrent =
      Array.isArray(tvlHistory) && tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      current_tvl_usd: tvlCurrent,
      chain_tvls: currentChainTvls ?? {},
      chain_count: chainCount,
      chains: data['chains'],
      tvl_7d_change_percent: tvl7dChange,
      tvl_30d_change_percent: tvl30dChange,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});

import { createAction } from '@activepieces/pieces-framework';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get historical TVL data for Ribbon Finance (last 30 days) from DeFiLlama',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/ribbon-finance');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl || [];

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recentHistory = tvlHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    const latestTvl = recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].tvl_usd : 0;
    const earliestTvl = recentHistory.length > 0 ? recentHistory[0].tvl_usd : 0;
    const tvlChange = earliestTvl > 0 ? (((latestTvl - earliestTvl) / earliestTvl) * 100).toFixed(2) : '0';

    return {
      data_points: recentHistory.length,
      tvl_change_30d_percent: tvlChange + '%',
      history: recentHistory,
    };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Marinade Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/marinade',
    });

    const data = response.body;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;

    if (!tvlHistory || !Array.isArray(tvlHistory)) {
      return { history: [], count: 0 };
    }

    // Get last 30 days
    const last30 = tvlHistory.slice(-30);

    const history = last30.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const latestTvl = history[history.length - 1]?.tvl_usd ?? 0;
    const earliestTvl = history[0]?.tvl_usd ?? 0;
    const changePct = earliestTvl > 0 ? ((latestTvl - earliestTvl) / earliestTvl) * 100 : 0;

    return {
      history,
      count: history.length,
      latest_tvl_usd: latestTvl,
      earliest_tvl_usd: earliestTvl,
      change_30d_pct: Math.round(changePct * 100) / 100,
    };
  },
});

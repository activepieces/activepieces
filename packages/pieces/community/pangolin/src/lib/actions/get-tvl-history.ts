import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description:
    'Fetch the last 30 days of historical TVL data for the Pangolin protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/pangolin',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlHistory || !Array.isArray(tvlHistory)) {
      return { history: [], count: 0 };
    }

    // Get last 30 days
    const last30Days = tvlHistory.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const latestTvl = last30Days[last30Days.length - 1]?.tvl_usd ?? 0;
    const earliestTvl = last30Days[0]?.tvl_usd ?? 0;
    const change30d = earliestTvl > 0 ? ((latestTvl - earliestTvl) / earliestTvl) * 100 : 0;

    return {
      history: last30Days,
      count: last30Days.length,
      latest_tvl_usd: latestTvl,
      change_30d_percent: parseFloat(change30d.toFixed(2)),
    };
  },
});

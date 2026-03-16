import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for the Wonderland protocol via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/wonderland',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlHistory || tvlHistory.length === 0) {
      return { history: [], data_points: 0 };
    }

    // Take the last 30 entries
    const last30Days = tvlHistory.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const latestTvl = last30Days[last30Days.length - 1]?.tvl_usd ?? 0;
    const earliestTvl = last30Days[0]?.tvl_usd ?? 0;
    const tvlChange30d = earliestTvl > 0 ? ((latestTvl - earliestTvl) / earliestTvl) * 100 : 0;

    return {
      data_points: last30Days.length,
      latest_tvl_usd: latestTvl,
      tvl_change_30d_percent: Math.round(tvlChange30d * 100) / 100,
      history: last30Days,
    };
  },
});

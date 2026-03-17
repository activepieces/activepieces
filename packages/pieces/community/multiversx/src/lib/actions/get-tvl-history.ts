import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch the last 30 days of historical TVL data for MultiversX from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/multiversx',
    });

    const data = response.body as Record<string, unknown>;
    const tvlData = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlData || !Array.isArray(tvlData)) {
      return { history: [], data_points: 0 };
    }

    // Get last 30 days
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const history = tvlData
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const latestTvl = history.length > 0 ? history[history.length - 1]?.tvl_usd ?? 0 : 0;
    const earliestTvl = history.length > 0 ? history[0]?.tvl_usd ?? 0 : 0;
    const tvlChange = earliestTvl > 0 ? ((latestTvl - earliestTvl) / earliestTvl) * 100 : 0;

    return {
      protocol: data['name'],
      data_points: history.length,
      history,
      summary: {
        latest_tvl: latestTvl,
        earliest_tvl: earliestTvl,
        change_30d_percent: Math.round(tvlChange * 100) / 100,
      },
    };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description: 'Get the last 30 days of historical TVL data for Harvest Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/harvest-finance',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArr || tvlArr.length === 0) {
      return { history: [], data_points: 0 };
    }

    const last30 = tvlArr.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const latestTvl = last30[last30.length - 1]?.tvl_usd ?? 0;
    const oldestTvl = last30[0]?.tvl_usd ?? 0;
    const change30d_pct = oldestTvl > 0 ? ((latestTvl - oldestTvl) / oldestTvl) * 100 : 0;

    return {
      history: last30,
      data_points: last30.length,
      latest_tvl_usd: latestTvl,
      change_30d_pct: parseFloat(change30d_pct.toFixed(2)),
    };
  },
});

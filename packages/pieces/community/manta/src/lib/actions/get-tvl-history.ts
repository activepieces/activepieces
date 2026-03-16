import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for Manta Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/manta',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArray || tvlArray.length === 0) {
      return { history: [], data_points: 0 };
    }

    // Get last 30 entries
    const last30 = tvlArray.slice(-30);

    const history = last30.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const latestTvl = history[history.length - 1]?.tvl_usd ?? 0;
    const earliestTvl = history[0]?.tvl_usd ?? 0;
    const changePct =
      earliestTvl > 0 ? ((latestTvl - earliestTvl) / earliestTvl) * 100 : 0;

    return {
      history,
      data_points: history.length,
      latest_tvl_usd: latestTvl,
      earliest_tvl_usd: earliestTvl,
      change_30d_percent: Math.round(changePct * 100) / 100,
    };
  },
});

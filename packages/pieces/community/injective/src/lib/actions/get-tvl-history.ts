import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for Injective from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/injective',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArray || tvlArray.length === 0) {
      return { history: [], dataPoints: 0 };
    }

    // Get last 30 days
    const last30 = tvlArray.slice(-30);

    const history = last30.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvlUsd: entry.totalLiquidityUSD,
    }));

    const current = history[history.length - 1]?.tvlUsd ?? 0;
    const previous = history[0]?.tvlUsd ?? 0;
    const changePercent = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      history,
      dataPoints: history.length,
      currentTvl: current,
      tvl30DaysAgo: previous,
      change30dPercent: Math.round(changePercent * 100) / 100,
    };
  },
});

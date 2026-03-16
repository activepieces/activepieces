import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Li.Fi from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/li.fi',
    });

    const data = response.body;
    const allTvl = data.tvl || [];

    // Get last 30 data points
    const last30 = allTvl.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl: entry.totalLiquidityUSD,
    }));

    const tvlValues = last30.map((e) => e.tvl);
    const latestTvl = tvlValues[tvlValues.length - 1] ?? 0;
    const earliestTvl = tvlValues[0] ?? 0;
    const maxTvl = Math.max(...tvlValues);
    const minTvl = Math.min(...tvlValues);
    const change30d = earliestTvl > 0
      ? Number((((latestTvl - earliestTvl) / earliestTvl) * 100).toFixed(2))
      : 0;

    return {
      protocol: data.name,
      days_returned: last30.length,
      current_tvl: latestTvl,
      tvl_30d_ago: earliestTvl,
      change_30d_pct: change30d,
      max_tvl_30d: maxTvl,
      min_tvl_30d: minTvl,
      history: last30,
    };
  },
});

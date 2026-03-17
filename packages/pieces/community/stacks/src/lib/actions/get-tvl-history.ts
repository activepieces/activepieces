import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for the Stacks protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/stacks',
    });
    const data = response.body as any;
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data['tvl'] || [];
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const last30Days = tvlHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));
    const tvlValues = last30Days.map((e) => e.tvl_usd);
    return {
      protocol: data['name'],
      period: 'last_30_days',
      data_points: last30Days.length,
      history: last30Days,
      min_tvl: tvlValues.length > 0 ? Math.min(...tvlValues) : null,
      max_tvl: tvlValues.length > 0 ? Math.max(...tvlValues) : null,
      latest_tvl: tvlValues.length > 0 ? tvlValues[tvlValues.length - 1] : null,
    };
  },
});

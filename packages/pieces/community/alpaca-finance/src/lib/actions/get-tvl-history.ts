import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Alpaca Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/alpaca-finance',
    });
    const data = response.body as Record<string, unknown>;
    const tvlHistory = (data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>) || [];

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recent = tvlHistory.filter((entry) => entry.date >= thirtyDaysAgo);

    const formatted = recent.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const tvlValues = formatted.map((e) => e.tvl_usd);
    const avgTvl = tvlValues.length > 0 ? tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length : 0;
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;

    return {
      history: formatted,
      data_points: formatted.length,
      period: 'last_30_days',
      stats: {
        average_tvl_usd: avgTvl,
        max_tvl_usd: maxTvl,
        min_tvl_usd: minTvl,
        current_tvl_usd: formatted[formatted.length - 1]?.tvl_usd ?? null,
      },
    };
  },
});

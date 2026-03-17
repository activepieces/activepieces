import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for VeChain from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/vechain',
    });

    const data = response.body as Record<string, unknown>;
    const tvlData = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlData || !Array.isArray(tvlData)) {
      return { history: [], count: 0 };
    }

    // Get the last 30 data points
    const last30 = tvlData.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const tvlValues = last30.map((e) => e.tvl_usd);
    const maxTvl = Math.max(...tvlValues);
    const minTvl = Math.min(...tvlValues);
    const avgTvl = tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length;
    const latestTvl = last30.length > 0 ? last30[last30.length - 1].tvl_usd : 0;
    const oldestTvl = last30.length > 0 ? last30[0].tvl_usd : 0;
    const changePercent = oldestTvl > 0 ? ((latestTvl - oldestTvl) / oldestTvl) * 100 : 0;

    return {
      history: last30,
      count: last30.length,
      period: '30 days',
      summary: {
        latest_tvl_usd: latestTvl,
        max_tvl_usd: maxTvl,
        min_tvl_usd: minTvl,
        avg_tvl_usd: Math.round(avgTvl),
        change_percent_30d: Math.round(changePercent * 100) / 100,
        start_date: last30.length > 0 ? last30[0].date : null,
        end_date: last30.length > 0 ? last30[last30.length - 1].date : null,
      },
    };
  },
});

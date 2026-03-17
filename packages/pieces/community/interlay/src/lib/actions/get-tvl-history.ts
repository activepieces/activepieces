import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description:
    'Get the last 30 days of historical TVL data for Interlay from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/interlay',
    });
    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{
      date: number;
      totalLiquidityUSD: number;
    }>;
    const now = Date.now() / 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const last30Days = tvlHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvl_usd: entry.totalLiquidityUSD,
      }));
    const tvlValues = last30Days.map((e) => e.tvl_usd);
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;
    const avgTvl =
      tvlValues.length > 0
        ? tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length
        : 0;
    return {
      history: last30Days,
      days_returned: last30Days.length,
      max_tvl_usd: maxTvl,
      min_tvl_usd: minTvl,
      avg_tvl_usd: avgTvl,
      latest_tvl_usd:
        last30Days.length > 0
          ? last30Days[last30Days.length - 1].tvl_usd
          : 0,
    };
  },
});

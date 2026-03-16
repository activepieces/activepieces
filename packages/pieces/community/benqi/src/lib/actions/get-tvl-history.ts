import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for Benqi via DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
      name: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/benqi',
      headers: { 'Accept': 'application/json' },
    });

    const data = response.body;
    const allTvl = data.tvl || [];

    // Last 30 data points
    const last30 = allTvl.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvlUSD: entry.totalLiquidityUSD,
    }));

    const tvlValues = last30.map((e) => e.tvlUSD);
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : null;
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : null;
    const avgTvl =
      tvlValues.length > 0
        ? tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length
        : null;

    return {
      protocol: data.name,
      periodDays: last30.length,
      history: last30,
      stats: {
        minTvlUSD: minTvl,
        maxTvlUSD: maxTvl,
        avgTvlUSD: avgTvl,
        startTvlUSD: last30.length > 0 ? last30[0].tvlUSD : null,
        endTvlUSD: last30.length > 0 ? last30[last30.length - 1].tvlUSD : null,
      },
    };
  },
});

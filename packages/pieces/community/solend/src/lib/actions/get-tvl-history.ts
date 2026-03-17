import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: "Fetch Solend's historical TVL for the last 30 days from DeFiLlama.",
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/solend',
    });

    const data = response.body as any;
    const tvlArray: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];

    // Get last 30 days
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = tvlArray
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvlUSD: entry.totalLiquidityUSD,
      }));

    const tvlValues = last30Days.map((e) => e.tvlUSD);
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : null;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : null;
    const latestTvl = last30Days.length > 0 ? last30Days[last30Days.length - 1].tvlUSD : null;

    return {
      protocol: data.name,
      periodDays: 30,
      dataPointCount: last30Days.length,
      latestTvlUSD: latestTvl,
      maxTvlUSD: maxTvl,
      minTvlUSD: minTvl,
      history: last30Days,
    };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the historical TVL data for Kamino Finance over the last 30 days from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
      name: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kamino',
    });

    const data = response.body;
    const allTvl = data.tvl || [];

    // Get last 30 days
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = allTvl
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvlUSD: entry.totalLiquidityUSD,
      }));

    const latestTvl = last30Days.length > 0 ? last30Days[last30Days.length - 1].tvlUSD : null;
    const earliestTvl = last30Days.length > 0 ? last30Days[0].tvlUSD : null;
    const tvlChange = latestTvl !== null && earliestTvl !== null && earliestTvl !== 0
      ? ((latestTvl - earliestTvl) / earliestTvl) * 100
      : null;

    return {
      protocol: data.name,
      periodDays: 30,
      dataPoints: last30Days.length,
      latestTvlUSD: latestTvl,
      tvlChange30dPercent: tvlChange !== null ? Math.round(tvlChange * 100) / 100 : null,
      history: last30Days,
    };
  },
});

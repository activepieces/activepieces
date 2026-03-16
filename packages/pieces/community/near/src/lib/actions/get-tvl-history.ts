import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for NEAR Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/near',
    });
    const allTvl = response.body.tvl ?? [];
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recentTvl = allTvl
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvlUsd: entry.totalLiquidityUSD,
      }));
    const tvlValues = recentTvl.map((e) => e.tvlUsd);
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;
    const latestTvl = recentTvl.length > 0 ? recentTvl[recentTvl.length - 1].tvlUsd : 0;
    return {
      history: recentTvl,
      dataPoints: recentTvl.length,
      latestTvlUsd: latestTvl,
      maxTvlUsd: maxTvl,
      minTvlUsd: minTvl,
    };
  },
});

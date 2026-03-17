import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Internet Computer Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<TvlDataPoint[]>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/v2/historicalChainTvl/ICP',
    });

    const allData = response.body;
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

    const last30Days = allData
      .filter((point) => point.date >= thirtyDaysAgo)
      .map((point) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvl: point.totalLiquidityUSD,
      }));

    const tvlValues = last30Days.map((p) => p.tvl);
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;
    const avgTvl = tvlValues.length > 0 ? tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length : 0;

    return {
      protocol: 'Internet Computer (ICP)',
      dataPoints: last30Days.length,
      history: last30Days,
      stats: {
        maxTvl,
        minTvl,
        avgTvl: Math.round(avgTvl),
        latestTvl: last30Days.length > 0 ? last30Days[last30Days.length - 1].tvl : 0,
      },
    };
  },
});

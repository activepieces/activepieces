import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistoryAction = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Retrieve the last 30 days of historical TVL data for the Kava protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kava',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as TvlDataPoint[] | undefined;

    if (!tvlHistory || !Array.isArray(tvlHistory)) {
      return { history: [], data_points: 0 };
    }

    // Get last 30 days
    const last30Days = tvlHistory.slice(-30).map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      timestamp: point.date,
      tvl_usd: point.totalLiquidityUSD,
    }));

    const latestTvl = last30Days.length > 0 ? last30Days[last30Days.length - 1].tvl_usd : 0;
    const earliestTvl = last30Days.length > 0 ? last30Days[0].tvl_usd : 0;
    const tvlChange = earliestTvl > 0 ? ((latestTvl - earliestTvl) / earliestTvl) * 100 : 0;

    return {
      history: last30Days,
      data_points: last30Days.length,
      latest_tvl_usd: latestTvl,
      tvl_change_30d_pct: Math.round(tvlChange * 100) / 100,
    };
  },
});

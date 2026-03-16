import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch the last 30 days of historical TVL data for Sommelier Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: TvlDataPoint[];
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sommelier',
    });

    const allTvlData: TvlDataPoint[] = response.body.tvl ?? [];

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recentData = allTvlData.filter(
      (point) => point.date >= thirtyDaysAgo
    );

    const history = recentData.map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      timestamp: point.date,
      tvlUsd: point.totalLiquidityUSD,
    }));

    return {
      periodDays: 30,
      dataPoints: history.length,
      history,
    };
  },
});

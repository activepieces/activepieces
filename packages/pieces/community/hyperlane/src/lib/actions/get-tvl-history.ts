import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for the Hyperlane protocol.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/hyperlane',
    });

    const data = response.body;
    const tvlData = data['tvl'] as TvlDataPoint[] | undefined;

    if (!tvlData || tvlData.length === 0) {
      return {
        period: '30 days',
        data_points: 0,
        history: [],
      };
    }

    const cutoffDate = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = tvlData
      .filter((point) => point.date >= cutoffDate)
      .map((point) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvl_usd: point.totalLiquidityUSD,
      }));

    const latestTvl = last30Days.length > 0 ? last30Days[last30Days.length - 1].tvl_usd : 0;
    const earliestTvl = last30Days.length > 0 ? last30Days[0].tvl_usd : 0;
    const tvlChange = earliestTvl > 0 ? ((latestTvl - earliestTvl) / earliestTvl) * 100 : 0;

    return {
      period: '30 days',
      data_points: last30Days.length,
      latest_tvl_usd: latestTvl,
      tvl_change_percent_30d: Math.round(tvlChange * 100) / 100,
      history: last30Days,
    };
  },
});

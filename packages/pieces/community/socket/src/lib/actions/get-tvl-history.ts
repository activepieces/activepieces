import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description:
    'Fetches the last 30 days of historical TVL data for the Socket Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/socket-protocol',
    });

    const data = response.body;
    const tvlHistory = (data['tvl'] as TvlDataPoint[] | undefined) ?? [];

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = tvlHistory.filter(
      (point) => point.date >= thirtyDaysAgo
    );

    const formatted = last30Days.map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      timestamp: point.date,
      tvl_usd: point.totalLiquidityUSD,
    }));

    const latestTvl =
      formatted.length > 0 ? formatted[formatted.length - 1].tvl_usd : null;
    const earliestTvl = formatted.length > 0 ? formatted[0].tvl_usd : null;
    const tvlChange =
      latestTvl !== null && earliestTvl !== null && earliestTvl !== 0
        ? ((latestTvl - earliestTvl) / earliestTvl) * 100
        : null;

    return {
      history: formatted,
      data_points: formatted.length,
      latest_tvl_usd: latestTvl,
      tvl_change_30d_percent: tvlChange !== null ? Math.round(tvlChange * 100) / 100 : null,
    };
  },
});

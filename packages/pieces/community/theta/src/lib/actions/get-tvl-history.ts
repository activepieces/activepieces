import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description:
    'Fetch the last 30 days of historical TVL data for Theta Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/theta',
    });

    const data = response.body;
    const tvlArray = (data['tvl'] ?? []) as TvlDataPoint[];

    // Take last 30 data points
    const last30 = tvlArray.slice(-30);

    const history = last30.map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      timestamp: point.date,
      tvl_usd: point.totalLiquidityUSD,
    }));

    const tvlValues = history.map((h) => h.tvl_usd);
    const latestTvl = tvlValues[tvlValues.length - 1] ?? 0;
    const earliestTvl = tvlValues[0] ?? 0;
    const change30d = earliestTvl > 0
      ? ((latestTvl - earliestTvl) / earliestTvl) * 100
      : 0;

    return {
      protocol: data['name'],
      period: '30 days',
      data_points: history.length,
      latest_tvl_usd: latestTvl,
      earliest_tvl_usd: earliestTvl,
      change_30d_pct: Math.round(change30d * 100) / 100,
      history,
    };
  },
});

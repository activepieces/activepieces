import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'getTvlHistory',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Sudoswap via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<TvlDataPoint[]>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sudoswap',
    });

    const data = response.body as unknown as Record<string, unknown>;
    const tvlHistory = (data['tvl'] as TvlDataPoint[]) || [];

    // Get last 30 days
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recent = tvlHistory
      .filter((point: TvlDataPoint) => point.date >= thirtyDaysAgo)
      .map((point: TvlDataPoint) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvl_usd: point.totalLiquidityUSD,
      }));

    const tvlValues = recent.map((p) => p.tvl_usd);
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;
    const avgTvl =
      tvlValues.length > 0
        ? tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length
        : 0;

    return {
      period: '30d',
      data_points: recent.length,
      history: recent,
      stats: {
        max_tvl_usd: maxTvl,
        min_tvl_usd: minTvl,
        avg_tvl_usd: Math.round(avgTvl),
      },
    };
  },
});

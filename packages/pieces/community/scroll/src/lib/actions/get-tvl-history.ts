import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../scroll-api';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description:
    'Fetch the historical TVL data for Scroll over the last 30 days from DeFiLlama, useful for trend analysis and charting.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<Record<string, unknown>>('/protocol/scroll');

    const allTvlData: TvlDataPoint[] = (data as any)?.tvl ?? [];

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = allTvlData
      .filter((point) => point.date >= thirtyDaysAgo)
      .map((point) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvlUsd: point.totalLiquidityUSD,
      }));

    const tvlValues = last30Days.map((p) => p.tvlUsd);
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;
    const latestTvl = last30Days.length > 0 ? last30Days[last30Days.length - 1].tvlUsd : 0;
    const earliestTvl = last30Days.length > 0 ? last30Days[0].tvlUsd : 0;
    const change30d = earliestTvl > 0 ? ((latestTvl - earliestTvl) / earliestTvl) * 100 : 0;

    return {
      protocol: 'Scroll',
      dataPoints: last30Days.length,
      latestTvlUsd: latestTvl,
      maxTvlUsd: maxTvl,
      minTvlUsd: minTvl,
      change30dPercent: Math.round(change30d * 100) / 100,
      history: last30Days,
    };
  },
});

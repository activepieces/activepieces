import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../blast-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description:
    'Fetch the last 30 days of historical Total Value Locked (TVL) data for the Blast protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<Record<string, unknown>>('/protocol/blast');
    const allTvl: Array<{ date: number; totalLiquidityUSD: number }> =
      (data as any).tvl ?? [];

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recent = allTvl
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvlUsd: entry.totalLiquidityUSD,
      }));

    const tvlValues = recent.map((e) => e.tvlUsd);
    const latestTvl = recent.length > 0 ? recent[recent.length - 1].tvlUsd : null;
    const earliestTvl = recent.length > 0 ? recent[0].tvlUsd : null;
    const changePercent =
      earliestTvl && latestTvl
        ? Number((((latestTvl - earliestTvl) / earliestTvl) * 100).toFixed(2))
        : null;

    return {
      periodDays: 30,
      dataPoints: recent.length,
      latestTvlUsd: latestTvl,
      earliestTvlUsd: earliestTvl,
      changePercent30d: changePercent,
      minTvlUsd: tvlValues.length ? Math.min(...tvlValues) : null,
      maxTvlUsd: tvlValues.length ? Math.max(...tvlValues) : null,
      history: recent,
    };
  },
});

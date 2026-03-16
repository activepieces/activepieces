import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../taiko-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for the Taiko ZK-EVM rollup from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/taiko');
    const allHistory: Array<{ date: number; totalLiquidityUSD: number }> =
      data.tvl ?? [];
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recent = allHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvlUsd: entry.totalLiquidityUSD,
      }));
    const tvlValues = recent.map((e) => e.tvlUsd);
    return {
      days: recent.length,
      minTvl: tvlValues.length ? Math.min(...tvlValues) : null,
      maxTvl: tvlValues.length ? Math.max(...tvlValues) : null,
      latestTvl: tvlValues.length ? tvlValues[tvlValues.length - 1] : null,
      history: recent,
    };
  },
});

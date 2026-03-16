import { createAction, Property } from '@activepieces/pieces-framework';
import { radiantRequest } from '../radiant-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Get historical TVL data for Radiant Capital from DeFiLlama.',
  props: {
    limit: Property.Number({
      displayName: 'Number of Data Points',
      description: 'How many historical data points to return (most recent first). Leave empty for all data.',
      required: false,
    }),
  },
  async run(context) {
    const data = await radiantRequest('/protocol/radiant-v2');
    const tvlHistory: Array<{ date: string; tvlUsd: number }> = [];

    const rawTvl: Array<{ date: number; totalLiquidityUSD: number }> =
      data.tvl ?? [];

    for (const entry of rawTvl) {
      tvlHistory.push({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvlUsd: entry.totalLiquidityUSD,
      });
    }

    // Most recent first
    tvlHistory.reverse();

    const limit = context.propsValue.limit;
    const result = limit && limit > 0 ? tvlHistory.slice(0, limit) : tvlHistory;

    return {
      dataPoints: result.length,
      history: result,
    };
  },
});

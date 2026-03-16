import { createAction, Property } from '@activepieces/pieces-framework';
import { siloRequest } from '../lib/silo-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get historical TVL data for Silo Finance from DeFiLlama.',
  props: {
    limit: Property.Number({
      displayName: 'Number of data points',
      description: 'How many historical data points to return (most recent first). Default: 30.',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const data = await siloRequest('/protocol/silo-finance');
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];

    const limit = context.propsValue.limit ?? 30;
    const recent = tvlHistory.slice(-limit).reverse();

    return {
      count: recent.length,
      history: recent.map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvlUsd: entry.totalLiquidityUSD,
      })),
    };
  },
});

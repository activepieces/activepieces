import { createAction, Property } from '@activepieces/pieces-framework';
import { morphoRequest } from '../morpho-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get historical TVL data for Morpho from DeFiLlama.',
  props: {
    limit: Property.Number({
      displayName: 'Number of Data Points',
      description: 'How many historical data points to return (most recent first). Leave empty for all.',
      required: false,
    }),
  },
  async run(context) {
    const data = await morphoRequest('/protocol/morpho');

    // tvl array: [{date: unix, totalLiquidityUSD: number}]
    let history: Array<{ date: string; tvlUsd: number }> = [];

    if (Array.isArray(data.tvl)) {
      history = data.tvl.map((entry: any) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvlUsd: entry.totalLiquidityUSD,
      }));
      history.reverse(); // most recent first
    }

    const limit = context.propsValue.limit;
    if (limit && limit > 0) {
      history = history.slice(0, limit);
    }

    return {
      totalDataPoints: history.length,
      history,
    };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { getTvlHistory } from '../ethena-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data points for Ethena protocol with a configurable limit.',
  props: {
    limit: Property.Number({
      displayName: 'Number of Data Points',
      description: 'How many historical TVL data points to return (most recent first). Default is 30.',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const limit = context.propsValue.limit ?? 30;
    const history = await getTvlHistory();

    const limited = history.slice(-Math.abs(limit)).reverse();

    return {
      count: limited.length,
      data_points: limited.map((point) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvl: point.totalLiquidityUSD,
        tvl_formatted: `$${Number(point.totalLiquidityUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      })),
    };
  },
});

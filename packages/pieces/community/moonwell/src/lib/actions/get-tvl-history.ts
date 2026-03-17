import { createAction, Property } from '@activepieces/pieces-framework';
import { getTvlHistoryFromCharts } from '../moonwell-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Returns historical TVL data points for the Moonwell protocol, with a configurable limit on the number of entries returned.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of historical data points to return (most recent first). Defaults to 30.',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const limit = context.propsValue.limit ?? 30;
    const history = await getTvlHistoryFromCharts();

    const limited = history.slice(-Math.abs(limit)).reverse();

    return {
      count: limited.length,
      totalDataPoints: history.length,
      data: limited.map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl: entry.totalLiquidityUSD,
        tvlFormatted: `$${entry.totalLiquidityUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      })),
    };
  },
});

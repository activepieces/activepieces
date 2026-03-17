import { createAction, Property } from '@activepieces/pieces-framework';
import { getTVLHistory } from '../compound-finance-api';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Returns historical TVL data points for Compound Finance. Optionally limit the number of returned data points.',
  auth: undefined,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of historical data points to return (most recent). Leave empty to return all.',
      required: false,
    }),
  },
  async run(context) {
    const limit = context.propsValue.limit as number | undefined;
    const history = await getTVLHistory(limit);
    return {
      data_points: history.map((point) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvl_usd: point.tvl,
      })),
      count: history.length,
    };
  },
});

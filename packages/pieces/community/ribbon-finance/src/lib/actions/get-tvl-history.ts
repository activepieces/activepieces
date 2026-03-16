import { createAction, Property } from '@activepieces/pieces-framework';
import { ribbonRequest } from '../ribbon-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Retrieve historical TVL data for Ribbon Finance. Returns the last N data points.',
  props: {
    limit: Property.Number({
      displayName: 'Number of Points',
      description: 'How many historical data points to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const data: Array<{ date: number; totalLiquidityUSD: number }> = await ribbonRequest('https://api.llama.fi/tvl/ribbon');
    const limit = context.propsValue.limit ?? 30;
    const sliced = data.slice(-limit);

    return {
      points_returned: sliced.length,
      history: sliced.map((point) => ({
        date: new Date(point.date * 1000).toISOString(),
        tvl_usd: point.totalLiquidityUSD,
      })),
    };
  },
});

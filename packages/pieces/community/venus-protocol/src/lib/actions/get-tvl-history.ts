import { createAction, Property } from '@activepieces/pieces-framework';
import { getTvlHistory } from '../venus-protocol-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Venus Protocol from DeFiLlama, with a configurable number of data points.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of historical data points to return (most recent first). Defaults to 30.',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const history = await getTvlHistory();
    const limit = context.propsValue.limit ?? 30;

    const sliced = history.slice(-limit).reverse();

    return {
      count: sliced.length,
      history: sliced.map((point) => ({
        date: new Date(point.date * 1000).toISOString(),
        tvl_usd: point.totalLiquidityUSD,
      })),
    };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { notionalRequest } from '../notional-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get historical TVL data for Notional Finance',
  auth: undefined,
  props: {
    points: Property.Number({
      displayName: 'Number of Data Points',
      description: 'How many historical TVL data points to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const data = await notionalRequest('https://api.llama.fi/tvl/notional') as Array<{date: number; totalLiquidityUSD: number}>;
    const points = context.propsValue.points ?? 30;
    const history = Array.isArray(data) ? data.slice(-points) : [];
    return {
      history,
      count: history.length,
      oldest: history[0],
      latest: history[history.length - 1],
    };
  },
});

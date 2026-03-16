import { createAction, Property } from '@activepieces/pieces-framework';
import { eulerRequest } from '../euler-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get historical TVL data for Euler Finance',
  auth: undefined,
  props: {
    limit: Property.Number({
      displayName: 'Number of Data Points',
      description: 'Number of historical TVL points to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const limit = context.propsValue.limit ?? 30;
    const data = await eulerRequest('https://api.llama.fi/tvl/euler') as { date: number; totalLiquidityUSD: number }[];
    const history = Array.isArray(data) ? data : [];
    const slice = history.slice(-limit);
    return {
      dataPoints: slice,
      count: slice.length,
      earliest: slice[0] ?? null,
      latest: slice[slice.length - 1] ?? null,
    };
  },
});

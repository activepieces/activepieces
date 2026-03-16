import { createAction, Property } from '@activepieces/pieces-framework';
import { lyraRequest } from '../lyra-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Lyra Finance. Returns last N data points.',
  auth: undefined,
  props: {
    limit: Property.Number({
      displayName: 'Number of Data Points',
      description: 'How many historical TVL points to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const limit = (context.propsValue.limit as number) ?? 30;
    const data = await lyraRequest('https://api.llama.fi/tvl/lyra') as Array<{ date: number; totalLiquidityUSD: number }>;
    const history = Array.isArray(data) ? data : [];
    const recent = history.slice(-limit);
    return {
      count: recent.length,
      history: recent,
      latest_tvl: recent.length > 0 ? recent[recent.length - 1] : null,
    };
  },
});

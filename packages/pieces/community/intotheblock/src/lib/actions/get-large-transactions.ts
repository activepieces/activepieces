import { createAction } from '@activepieces/pieces-framework';
import { makeIntoTheBlockRequest, symbolProp, timeframeProp } from '../common/intotheblock-api';

export const getLargeTransactions = createAction({
  name: 'get_large_transactions',
  displayName: 'Get Large Transactions',
  description:
    'Returns the count and volume of large transactions (whale activity) for a given asset over the selected timeframe.',
  props: {
    symbol: symbolProp,
    timeframe: timeframeProp,
  },
  async run(context) {
    const { symbol, timeframe } = context.propsValue;
    return makeIntoTheBlockRequest({
      apiKey: context.auth as string,
      symbol,
      endpoint: 'signals/largetransactions',
      params: { timeframe: timeframe as string },
    });
  },
});

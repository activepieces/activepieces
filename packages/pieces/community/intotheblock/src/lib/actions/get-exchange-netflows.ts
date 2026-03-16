import { createAction } from '@activepieces/pieces-framework';
import { makeIntoTheBlockRequest, symbolProp, timeframeProp } from '../common/intotheblock-api';

export const getExchangeNetflows = createAction({
  name: 'get_exchange_netflows',
  displayName: 'Get Exchange Netflows',
  description:
    'Returns exchange inflows vs outflows for a given asset. Positive netflow = more coins entering exchanges (potential sell pressure); negative = coins leaving exchanges (potential accumulation).',
  props: {
    symbol: symbolProp,
    timeframe: timeframeProp,
  },
  async run(context) {
    const { symbol, timeframe } = context.propsValue;
    return makeIntoTheBlockRequest({
      apiKey: context.auth as string,
      symbol,
      endpoint: 'signals/exchangenetflows',
      params: { timeframe: timeframe as string },
    });
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { makeIntoTheBlockRequest, symbolProp, timeframeProp } from '../common/intotheblock-api';

export const getConcentration = createAction({
  name: 'get_concentration',
  displayName: 'Get Address Concentration',
  description:
    'Returns address concentration metrics showing what percentage of the supply is held by whales and other address tiers.',
  props: {
    symbol: symbolProp,
    timeframe: timeframeProp,
  },
  async run(context) {
    const { symbol, timeframe } = context.propsValue;
    return makeIntoTheBlockRequest({
      apiKey: context.auth as string,
      symbol,
      endpoint: 'signals/concentration',
      params: { timeframe: timeframe as string },
    });
  },
});

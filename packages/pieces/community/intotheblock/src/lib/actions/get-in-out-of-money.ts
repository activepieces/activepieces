import { createAction } from '@activepieces/pieces-framework';
import { makeIntoTheBlockRequest, symbolProp, timeframeProp } from '../common/intotheblock-api';

export const getInOutOfMoney = createAction({
  name: 'get_in_out_of_money',
  displayName: 'Get In/Out of the Money',
  description:
    'Returns the percentage of holders currently in profit (in the money) or at a loss (out of the money) for a given asset.',
  props: {
    symbol: symbolProp,
    timeframe: timeframeProp,
  },
  async run(context) {
    const { symbol, timeframe } = context.propsValue;
    return makeIntoTheBlockRequest({
      apiKey: context.auth as string,
      symbol,
      endpoint: 'signals/inoutofthemoney',
      params: { timeframe: timeframe as string },
    });
  },
});

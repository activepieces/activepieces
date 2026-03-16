import { createAction } from '@activepieces/pieces-framework';
import { makeIntoTheBlockRequest, symbolProp, timeframeProp } from '../common/intotheblock-api';

export const getNetworkGrowth = createAction({
  name: 'get_network_growth',
  displayName: 'Get Network Growth',
  description:
    'Returns the rate of new address creation for a given asset, indicating network adoption and growth momentum.',
  props: {
    symbol: symbolProp,
    timeframe: timeframeProp,
  },
  async run(context) {
    const { symbol, timeframe } = context.propsValue;
    return makeIntoTheBlockRequest({
      apiKey: context.auth as string,
      symbol,
      endpoint: 'signals/networkgrowth',
      params: { timeframe: timeframe as string },
    });
  },
});

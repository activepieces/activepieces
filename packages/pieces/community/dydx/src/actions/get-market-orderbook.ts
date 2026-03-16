import { createAction, Property } from '@activepieces/pieces-framework';
import { dydxRequest } from '../lib/dydx-api';

export const getMarketOrderbook = createAction({
  name: 'get_market_orderbook',
  displayName: 'Get Market Orderbook',
  description: 'Get the real-time orderbook for a perpetual market on dYdX',
  auth: undefined,
  props: {
    ticker: Property.ShortText({
      displayName: 'Market Ticker',
      description: 'The market ticker symbol (e.g. BTC-USD, ETH-USD)',
      required: true,
    }),
  },
  async run(context) {
    const { ticker } = context.propsValue;
    return await dydxRequest(`/v4/orderbooks/perpetualMarket/${ticker}`);
  },
});

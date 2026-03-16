import { createAction, Property } from '@activepieces/pieces-framework';
import { dydxRequest } from '../lib/dydx-api';

export const getMarketTrades = createAction({
  name: 'get_market_trades',
  displayName: 'Get Market Trades',
  description: 'Get recent trades for a perpetual market on dYdX',
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
    return await dydxRequest(`/v4/trades/perpetualMarket/${ticker}`, { limit: '20' });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { dydxRequest } from '../lib/dydx-api';

export const getCandles = createAction({
  name: 'get_candles',
  displayName: 'Get Candles',
  description: 'Get OHLCV candlestick data for a perpetual market on dYdX',
  auth: undefined,
  props: {
    ticker: Property.ShortText({
      displayName: 'Market Ticker',
      description: 'The market ticker symbol (e.g. BTC-USD, ETH-USD)',
      required: true,
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'The candle time resolution',
      required: true,
      options: {
        options: [
          { label: '1 Minute', value: '1MIN' },
          { label: '5 Minutes', value: '5MINS' },
          { label: '15 Minutes', value: '15MINS' },
          { label: '30 Minutes', value: '30MINS' },
          { label: '1 Hour', value: '1HOUR' },
          { label: '4 Hours', value: '4HOURS' },
          { label: '1 Day', value: '1DAY' },
          { label: '1 Week', value: '1WEEK' },
        ],
      },
    }),
  },
  async run(context) {
    const { ticker, resolution } = context.propsValue;
    return await dydxRequest(`/v4/candles/perpetualMarkets/${ticker}`, {
      resolution: resolution as string,
      limit: '24',
    });
  },
});

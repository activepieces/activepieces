import { createAction, Property } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { binanceInput } from '../common/input';
import { symbolProp } from '../common/props';
import { getRollingWindowTickerOutputSchema } from '../output-schemas';

const DEFAULT_WINDOW = '1h';

export const getRollingWindowTicker = createAction({
  name: 'get_rolling_window_ticker',
  classification: 'READ',
  displayName: 'Get Price Change (Rolling Window)',
  description: 'Get price change, high, low and volume for a Binance spot trading pair over the last 1 minute to 7 days.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets price change and percent, open/high/low/last price, volume and trade count for one Binance spot pair over a rolling window ending now, from 1m to 59m, 1h to 23h, or 1d to 7d (default 1h). Use to answer "how much did X move in the last N minutes/hours/days"; use Get 24h Ticker Stats for the 24-hour view with bid/ask, or Get Candles for a time series. Prices and volumes are exact decimal strings. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    symbol: symbolProp,
    window_size: Property.ShortText({
      displayName: 'Window Size',
      description: 'How far back the window reaches: a number and a unit, 1m to 59m (minutes), 1h to 23h (hours) or 1d to 7d (days), for example 15m, 4h or 7d. Units cannot be combined. Defaults to 1h.',
      required: false,
      defaultValue: DEFAULT_WINDOW,
    }),
  },
  outputSchema: getRollingWindowTickerOutputSchema,
  async run(context) {
    const symbol = binanceInput.symbol({ value: context.propsValue.symbol });
    const windowSize = binanceInput.windowSize({ value: context.propsValue.window_size, defaultValue: DEFAULT_WINDOW });
    const stats = await binanceClient.get<Record<string, unknown>>({
      path: '/ticker',
      queryParams: { symbol, windowSize },
      subject: `the trading pair "${symbol}"`,
    });
    return { ...stats, windowSize };
  },
});

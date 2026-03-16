import { createAction, Property } from '@activepieces/pieces-framework';
import { coinglassAuth } from '../../index';
import { coinglassRequest } from '../common/coinglass-api';

export const getOpenInterestHistory = createAction({
  name: 'get_open_interest_history',
  displayName: 'Get Open Interest History',
  description:
    'Get historical open interest data (OHLC) for a futures trading pair across exchanges.',
  auth: coinglassAuth,
  props: {
    symbol: Property.ShortText({
      displayName: 'Symbol',
      description: 'Crypto symbol (e.g. BTC, ETH, SOL)',
      required: true,
      defaultValue: 'BTC',
    }),
    interval: Property.StaticDropdown({
      displayName: 'Interval',
      description: 'Time interval for OHLC candles',
      required: true,
      defaultValue: '1d',
      options: {
        options: [
          { label: '4 Hours', value: '4h' },
          { label: '8 Hours', value: '8h' },
          { label: '1 Day', value: '1d' },
        ],
      },
    }),
    exchange: Property.ShortText({
      displayName: 'Exchange (optional)',
      description:
        'Filter by exchange (e.g. Binance, OKX, Bybit). Leave empty for all.',
      required: false,
    }),
    startTime: Property.Number({
      displayName: 'Start Time (optional)',
      description: 'Start timestamp in milliseconds (Unix epoch)',
      required: false,
    }),
    endTime: Property.Number({
      displayName: 'End Time (optional)',
      description: 'End timestamp in milliseconds (Unix epoch)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of candles to return (max 4500)',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { symbol, interval, exchange, startTime, endTime, limit } =
      context.propsValue;
    const clampedLimit = Math.min(4500, Math.max(1, limit ?? 100));

    const data = await coinglassRequest(
      context.auth,
      '/api/futures/open-interest/history',
      {
        symbol: symbol.toUpperCase(),
        interval,
        exchange: exchange || undefined,
        startTime: startTime != null ? startTime : undefined,
        endTime: endTime != null ? endTime : undefined,
        limit: clampedLimit,
      }
    );
    return data;
  },
});

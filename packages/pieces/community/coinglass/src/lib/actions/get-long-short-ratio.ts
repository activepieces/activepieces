import { createAction, Property } from '@activepieces/pieces-framework';
import { coinglassAuth } from '../../index';
import { coinglassRequest } from '../common/coinglass-api';

export const getLongShortRatio = createAction({
  name: 'get_long_short_ratio',
  displayName: 'Get Long/Short Ratio',
  description:
    'Get historical long/short account ratio for a futures symbol on a specific exchange.',
  auth: coinglassAuth,
  props: {
    symbol: Property.ShortText({
      displayName: 'Symbol',
      description: 'Crypto symbol (e.g. BTC, ETH, SOL)',
      required: true,
      defaultValue: 'BTC',
    }),
    exchange: Property.ShortText({
      displayName: 'Exchange',
      description: 'Exchange name (e.g. Binance, OKX, Bybit)',
      required: true,
      defaultValue: 'Binance',
    }),
    interval: Property.StaticDropdown({
      displayName: 'Interval',
      description: 'Time interval for ratio data',
      required: true,
      defaultValue: '1h',
      options: {
        options: [
          { label: '5 Minutes', value: '5m' },
          { label: '15 Minutes', value: '15m' },
          { label: '30 Minutes', value: '30m' },
          { label: '1 Hour', value: '1h' },
          { label: '4 Hours', value: '4h' },
          { label: '1 Day', value: '1d' },
        ],
      },
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
  },
  async run(context) {
    const { symbol, exchange, interval, startTime, endTime } =
      context.propsValue;

    const data = await coinglassRequest(
      context.auth,
      '/api/futures/global-long-short-account-ratio/history',
      {
        symbol: symbol.toUpperCase(),
        exchange,
        interval,
        startTime: startTime != null ? startTime : undefined,
        endTime: endTime != null ? endTime : undefined,
      }
    );
    return data;
  },
});

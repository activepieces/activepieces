import { createAction, Property } from '@activepieces/pieces-framework';
import { coinglassAuth } from '../../index';
import { coinglassRequest } from '../common/coinglass-api';

export const getLiquidationHistory = createAction({
  name: 'get_liquidation_history',
  displayName: 'Get Liquidation History',
  description:
    'Get historical liquidation data with long/short breakdown for a futures symbol.',
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
      description: 'Time interval for liquidation data',
      required: true,
      defaultValue: '1h',
      options: {
        options: [
          { label: '1 Hour', value: '1h' },
          { label: '4 Hours', value: '4h' },
          { label: '12 Hours', value: '12h' },
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
    const { symbol, interval, startTime, endTime } = context.propsValue;

    const data = await coinglassRequest(
      context.auth,
      '/api/futures/liquidations/history',
      {
        symbol: symbol.toUpperCase(),
        interval,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      }
    );
    return data;
  },
});

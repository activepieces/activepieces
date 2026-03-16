import { createAction, Property } from '@activepieces/pieces-framework';
import { cryptocompareAuth } from '../../index';
import { cryptocompareRequest } from '../cryptocompare-api';

export const getHistoricalDailyAction = createAction({
  auth: cryptocompareAuth,
  name: 'get_historical_daily',
  displayName: 'Get Historical Daily OHLCV',
  description: 'Get daily OHLCV (open, high, low, close, volume) historical data for a cryptocurrency pair.',
  props: {
    fromSymbol: Property.ShortText({
      displayName: 'From Symbol',
      description: 'The cryptocurrency symbol (e.g. BTC, ETH).',
      required: true,
      defaultValue: 'BTC',
    }),
    toSymbol: Property.ShortText({
      displayName: 'To Symbol',
      description: 'The currency to convert to (e.g. USD, EUR).',
      required: true,
      defaultValue: 'USD',
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of data points to return (max 2000).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run({ auth, propsValue }) {
    const { fromSymbol, toSymbol, limit } = propsValue;
    return cryptocompareRequest(
      auth as string,
      '/data/v2/histoday',
      { fsym: fromSymbol, tsym: toSymbol, limit: limit ?? 30 }
    );
  },
});

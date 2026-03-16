import { createAction, Property } from '@activepieces/pieces-framework';
import { cryptocompareAuth } from '../../index';
import { cryptocompareRequest } from '../cryptocompare-api';

export const getHistoricalHourlyAction = createAction({
  auth: cryptocompareAuth,
  name: 'get_historical_hourly',
  displayName: 'Get Historical Hourly OHLCV',
  description: 'Get hourly OHLCV (open, high, low, close, volume) historical data for a cryptocurrency pair.',
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
      defaultValue: 24,
    }),
  },
  async run({ auth, propsValue }) {
    const { fromSymbol, toSymbol, limit } = propsValue;
    return cryptocompareRequest(
      auth as string,
      '/data/v2/histohour',
      { fsym: fromSymbol, tsym: toSymbol, limit: limit ?? 24 }
    );
  },
});

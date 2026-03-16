import { createAction, Property } from '@activepieces/pieces-framework';
import { cryptocompareAuth } from '../../index';
import { cryptocompareRequest } from '../cryptocompare-api';

export const getFullDataAction = createAction({
  auth: cryptocompareAuth,
  name: 'get_full_data',
  displayName: 'Get Full Market Data',
  description: 'Get full market data including OHLCV stats, market cap, and supply for multiple coins.',
  props: {
    fromSymbols: Property.ShortText({
      displayName: 'From Symbols',
      description: 'Comma-separated list of cryptocurrency symbols (e.g. BTC,ETH).',
      required: true,
      defaultValue: 'BTC,ETH',
    }),
    toSymbols: Property.ShortText({
      displayName: 'To Symbols',
      description: 'Comma-separated list of currency symbols to convert to (e.g. USD,EUR).',
      required: true,
      defaultValue: 'USD',
    }),
  },
  async run({ auth, propsValue }) {
    const { fromSymbols, toSymbols } = propsValue;
    return cryptocompareRequest(
      auth as string,
      '/data/pricemultifull',
      { fsyms: fromSymbols, tsyms: toSymbols }
    );
  },
});

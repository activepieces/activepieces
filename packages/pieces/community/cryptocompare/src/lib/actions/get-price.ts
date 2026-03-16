import { createAction, Property } from '@activepieces/pieces-framework';
import { cryptocompareAuth } from '../../index';
import { cryptocompareRequest } from '../cryptocompare-api';

export const getPriceAction = createAction({
  auth: cryptocompareAuth,
  name: 'get_price',
  displayName: 'Get Current Price',
  description: 'Get the current price of a cryptocurrency in one or more currencies.',
  props: {
    fromSymbol: Property.ShortText({
      displayName: 'From Symbol',
      description: 'The cryptocurrency symbol to convert from (e.g. BTC, ETH).',
      required: true,
      defaultValue: 'BTC',
    }),
    toSymbols: Property.ShortText({
      displayName: 'To Symbols',
      description: 'Comma-separated list of currency symbols to convert to (e.g. USD,EUR,GBP).',
      required: true,
      defaultValue: 'USD,EUR',
    }),
  },
  async run({ auth, propsValue }) {
    const { fromSymbol, toSymbols } = propsValue;
    return cryptocompareRequest(
      auth as string,
      '/data/price',
      { fsym: fromSymbol, tsyms: toSymbols }
    );
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { coinglassAuth } from '../../index';
import { coinglassRequest } from '../common/coinglass-api';

export const getGlobalOpenInterest = createAction({
  name: 'get_global_open_interest',
  displayName: 'Get Global Open Interest',
  description:
    'Get open interest aggregated across all exchanges for a futures symbol.',
  auth: coinglassAuth,
  props: {
    symbol: Property.ShortText({
      displayName: 'Symbol',
      description: 'Crypto symbol (e.g. BTC, ETH, SOL)',
      required: true,
      defaultValue: 'BTC',
    }),
  },
  async run(context) {
    const { symbol } = context.propsValue;

    const data = await coinglassRequest(
      context.auth,
      '/api/futures/open-interest/exchange-list',
      {
        symbol: symbol.toUpperCase(),
      }
    );
    return data;
  },
});

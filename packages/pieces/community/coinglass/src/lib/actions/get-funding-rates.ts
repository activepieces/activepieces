import { createAction, Property } from '@activepieces/pieces-framework';
import { coinglassAuth } from '../../index';
import { coinglassRequest } from '../common/coinglass-api';

export const getFundingRates = createAction({
  name: 'get_funding_rates',
  displayName: 'Get Funding Rates',
  description:
    'Get current funding rates for a futures symbol across all exchanges.',
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
      '/api/futures/funding-rates/current',
      {
        symbol: symbol.toUpperCase(),
      }
    );
    return data;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { cryptocompareAuth } from '../../index';
import { cryptocompareRequest } from '../cryptocompare-api';

export const getTopByMarketCapAction = createAction({
  auth: cryptocompareAuth,
  name: 'get_top_by_market_cap',
  displayName: 'Get Top Coins by Market Cap',
  description: 'Get a list of top cryptocurrencies ranked by market cap with full OHLCV data.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of top coins to return (max 100).',
      required: false,
      defaultValue: 20,
    }),
    toSymbol: Property.ShortText({
      displayName: 'To Symbol',
      description: 'The currency to use for market cap (e.g. USD, EUR).',
      required: false,
      defaultValue: 'USD',
    }),
  },
  async run({ auth, propsValue }) {
    const { limit, toSymbol } = propsValue;
    return cryptocompareRequest(
      auth as string,
      '/data/top/mktcapfull',
      { limit: limit ?? 20, tsym: toSymbol ?? 'USD' }
    );
  },
});

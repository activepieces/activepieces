import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../coincap-api';

export const getMarkets = createAction({
  name: 'get_markets',
  displayName: 'Get Markets',
  description: 'List exchange market pairs with pricing and volume data.',
  props: {
    exchangeId: Property.ShortText({
      displayName: 'Exchange ID',
      description: 'Filter by exchange (e.g. "binance", "coinbase").',
      required: false,
    }),
    baseSymbol: Property.ShortText({
      displayName: 'Base Symbol',
      description: 'Filter by base asset symbol (e.g. "BTC").',
      required: false,
    }),
    quoteSymbol: Property.ShortText({
      displayName: 'Quote Symbol',
      description: 'Filter by quote asset symbol (e.g. "USD", "USDT").',
      required: false,
    }),
    baseId: Property.ShortText({
      displayName: 'Base Asset ID',
      description: 'Filter by base asset ID (e.g. "bitcoin").',
      required: false,
    }),
    quoteId: Property.ShortText({
      displayName: 'Quote Asset ID',
      description: 'Filter by quote asset ID (e.g. "tether").',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of results to return (default 20, max 2000).',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip for pagination.',
      required: false,
    }),
  },
  async run(context) {
    const { exchangeId, baseSymbol, quoteSymbol, baseId, quoteId, limit, offset } =
      context.propsValue;
    return makeRequest(HttpMethod.GET, '/markets', {
      exchangeId,
      baseSymbol,
      quoteSymbol,
      baseId,
      quoteId,
      limit,
      offset,
    });
  },
});

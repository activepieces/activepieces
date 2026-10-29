import { createAction, Property } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { binanceInput } from '../common/input';
import { symbolProp } from '../common/props';
import { getOrderBookOutputSchema } from '../output-schemas';

const DEFAULT_DEPTH = 20;

export const getOrderBook = createAction({
  name: 'get_order_book',
  classification: 'READ',
  displayName: 'Get Order Book',
  description: 'Get the current best bids and asks (order book depth) of a Binance spot trading pair.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the current order book for one Binance spot pair such as BTCUSDT: the best bid and ask price levels with their quantities, best first, up to the requested depth per side (1-5000, default 20). Use to judge liquidity, spread or the price a large order would fill at; use Get Price when only the last trade price is needed. Depths above 100 cost far more rate-limit weight, so keep it small. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    symbol: symbolProp,
    limit: Property.Number({
      displayName: 'Depth',
      description:
        'Price levels to return on each side, 1 to 5000. Defaults to 20. Binance rate-limit weight: 5 up to 100 levels, 25 up to 500, 50 up to 1000, 250 above that.',
      required: false,
      defaultValue: DEFAULT_DEPTH,
    }),
  },
  outputSchema: getOrderBookOutputSchema,
  async run(context) {
    const symbol = binanceInput.symbol({ value: context.propsValue.symbol });
    const limit = binanceInput.limit({ value: context.propsValue.limit, min: 1, max: 5000, defaultValue: DEFAULT_DEPTH, fieldName: 'Depth' });
    const book = await binanceClient.get<{ lastUpdateId: number; bids: [string, string][]; asks: [string, string][] }>({
      path: '/depth',
      queryParams: { symbol, limit: String(limit) },
      subject: `the trading pair "${symbol}"`,
    });
    return {
      symbol,
      lastUpdateId: book.lastUpdateId,
      bids: book.bids.map(([price, quantity]) => ({ price, quantity })),
      asks: book.asks.map(([price, quantity]) => ({ price, quantity })),
    };
  },
});

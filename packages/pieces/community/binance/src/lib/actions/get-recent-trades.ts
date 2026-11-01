import { createAction, Property } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { binanceInput } from '../common/input';
import { symbolProp } from '../common/props';
import { getRecentTradesOutputSchema } from '../output-schemas';

const DEFAULT_LIMIT = 50;

export const getRecentTrades = createAction({
  name: 'get_recent_trades',
  classification: 'READ',
  displayName: 'Get Recent Trades',
  description: 'Get the most recent trades of a Binance spot trading pair.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the most recent public trades for one Binance spot pair such as BTCUSDT (price, quantity, quote quantity, time, and whether the buyer was the maker), oldest first, up to the requested count (1-1000, default 50). Use to see live trading activity; use Get Candles for aggregated price history over time. Only the latest trades are available, not a time range. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    symbol: symbolProp,
    limit: Property.Number({
      displayName: 'Number of Trades',
      description: 'How many of the most recent trades to return, 1 to 1000. Defaults to 50.',
      required: false,
      defaultValue: DEFAULT_LIMIT,
    }),
  },
  outputSchema: getRecentTradesOutputSchema,
  async run(context) {
    const symbol = binanceInput.symbol({ value: context.propsValue.symbol });
    const limit = binanceInput.limit({ value: context.propsValue.limit, min: 1, max: 1000, defaultValue: DEFAULT_LIMIT, fieldName: 'Number of Trades' });
    const trades = await binanceClient.get<BinanceTrade[]>({
      path: '/trades',
      queryParams: { symbol, limit: String(limit) },
      subject: `the trading pair "${symbol}"`,
    });
    return { symbol, trades, count: trades.length };
  },
});

type BinanceTrade = {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
};

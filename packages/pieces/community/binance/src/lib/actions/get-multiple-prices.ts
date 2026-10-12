import { createAction, Property } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { binanceInput } from '../common/input';
import { getMultiplePricesOutputSchema } from '../output-schemas';

export const getMultiplePrices = createAction({
  name: 'get_multiple_prices',
  classification: 'READ',
  displayName: 'Get Multiple Prices',
  description: 'Get the latest trade prices of up to 100 Binance spot trading pairs in one call.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the latest Binance spot trade prices for up to 100 trading pair symbols (such as BTCUSDT, ETHUSDT) in one request. Use instead of calling Get Price repeatedly; use Get 24h Ticker Stats for change and volume. Every symbol must be listed on Binance or the whole call fails; listed pairs that are not trading right now are returned in notTrading instead of with a price. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    symbols: Property.Array({
      displayName: 'Symbols',
      description: `Trading pairs to price, for example BTCUSDT and ETHUSDT (base asset followed by quote asset). Up to ${binanceInput.MAX_SYMBOLS_PER_CALL}. Spaces and '/' are removed, letters are upper-cased and duplicates are dropped. A comma-separated list in one item also works.`,
      required: true,
    }),
  },
  outputSchema: getMultiplePricesOutputSchema,
  async run(context) {
    const symbols = binanceInput.symbols({ value: context.propsValue.symbols });
    const rows = await binanceClient.get<{ symbol: string; price: string }[]>({
      path: '/ticker/price',
      queryParams: { symbols: JSON.stringify(symbols), symbolStatus: 'TRADING' },
      subject: `one or more of these symbols (${symbols.join(', ')})`,
    });
    const priceBySymbol = new Map(rows.map((row) => [row.symbol, row.price]));
    const prices: { symbol: string; price: string }[] = [];
    const notTrading: string[] = [];
    for (const symbol of symbols) {
      const price = priceBySymbol.get(symbol);
      if (price === undefined) {
        notTrading.push(symbol);
      } else {
        prices.push({ symbol, price });
      }
    }
    return { prices, count: prices.length, notTrading };
  },
});

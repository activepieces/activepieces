import { createAction } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { binanceInput } from '../common/input';
import { symbolProp } from '../common/props';
import { getPriceOutputSchema } from '../output-schemas';

export const binanceGetPrice = createAction({
  name: 'binance_get_price',
  classification: 'READ',
  displayName: 'Get Price',
  description: 'Get the latest trade price of one Binance spot trading pair.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets the latest Binance spot trade price for one trading pair symbol such as BTCUSDT (base asset followed by quote asset). Use for a single live price; use Get Multiple Prices for up to 100 pairs in one call, or Get 24h Ticker Stats when you also need change and volume. The pair must be listed and currently trading on Binance (find symbols with List Trading Pairs); the price is an exact decimal string. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    symbol: symbolProp,
  },
  outputSchema: getPriceOutputSchema,
  async run(context) {
    const symbol = binanceInput.symbol({ value: context.propsValue.symbol });
    const data = await binanceClient.get<{ symbol: string; price: string }>({
      path: '/ticker/price',
      queryParams: { symbol, symbolStatus: 'TRADING' },
      subject: `the trading pair "${symbol}"`,
    });
    return { symbol: data.symbol, price: data.price };
  },
});

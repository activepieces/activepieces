import { createAction } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { binanceInput } from '../common/input';
import { symbolProp } from '../common/props';
import { getAveragePriceOutputSchema } from '../output-schemas';

export const getAveragePrice = createAction({
  name: 'get_average_price',
  classification: 'READ',
  displayName: 'Get Average Price',
  description: "Get Binance's current average price of a spot trading pair over its short averaging window (5 minutes).",
  audience: 'both',
  aiMetadata: {
    description:
      "Gets Binance's current average price for one spot pair such as BTCUSDT, computed over a short window (mins, usually 5 minutes). Use when a smoothed price is better than the last trade, for example for price-based order limits; use Get Price for the latest trade. The price is an exact decimal string. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    symbol: symbolProp,
  },
  outputSchema: getAveragePriceOutputSchema,
  async run(context) {
    const symbol = binanceInput.symbol({ value: context.propsValue.symbol });
    const data = await binanceClient.get<{ mins: number; price: string; closeTime: number }>({
      path: '/avgPrice',
      queryParams: { symbol },
      subject: `the trading pair "${symbol}"`,
    });
    return { symbol, mins: data.mins, price: data.price, closeTime: data.closeTime };
  },
});

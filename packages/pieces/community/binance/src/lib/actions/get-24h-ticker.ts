import { createAction, Property } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { binanceInput } from '../common/input';
import { symbolProp } from '../common/props';
import { get24hTickerOutputSchema } from '../output-schemas';

export const get24hTicker = createAction({
  name: 'get_24h_ticker',
  classification: 'READ',
  displayName: 'Get 24h Ticker Stats',
  description: 'Get 24-hour price change, high, low, volume and best bid/ask for a Binance spot trading pair.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets rolling 24-hour statistics for one Binance spot pair such as BTCUSDT. The Full detail level (default) returns price change and percent, weighted average, previous close, best bid/ask, open/high/low/last price, volumes and trade count; Mini returns only open/high/low/last price, volumes and trade count. Use for a daily market summary; use Get Price Change (Rolling Window) for any other window from 1 minute to 7 days. Prices and volumes are exact decimal strings. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    symbol: symbolProp,
    type: Property.StaticDropdown({
      displayName: 'Detail Level',
      description: 'Full (default) adds price change and percent, weighted average price, previous close, last quantity and best bid/ask. Mini returns only open, high, low and last price, volumes and trade count.',
      required: false,
      defaultValue: 'FULL',
      options: {
        disabled: false,
        options: [
          { label: 'Full', value: 'FULL' },
          { label: 'Mini', value: 'MINI' },
        ],
      },
    }),
  },
  outputSchema: get24hTickerOutputSchema,
  async run(context) {
    const symbol = binanceInput.symbol({ value: context.propsValue.symbol });
    const type = context.propsValue.type ?? 'FULL';
    if (type !== 'FULL' && type !== 'MINI') {
      throw new Error('Detail Level must be FULL or MINI.');
    }
    return await binanceClient.get<Record<string, unknown>>({
      path: '/ticker/24hr',
      queryParams: { symbol, type },
      subject: `the trading pair "${symbol}"`,
    });
  },
});

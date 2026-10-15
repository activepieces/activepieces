import { createAction } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { exchangeInfo, ExchangeInfoResponse } from '../common/exchange-info';
import { binanceInput } from '../common/input';
import { symbolProp } from '../common/props';
import { getTradingPairRulesOutputSchema } from '../output-schemas';

export const getTradingPairRules = createAction({
  name: 'get_trading_pair_rules',
  classification: 'READ',
  displayName: 'Get Trading Pair Rules',
  description: 'Get the trading rules of a Binance spot pair: status, tick size, quantity step, minimum and maximum order size and value.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the trading rules for one Binance spot pair such as BTCUSDT: status, base and quote asset, precisions, allowed order types, and the price filter (tick size, min/max price), lot size (step size, min/max quantity) and notional limits (min/max order value), plus the raw filter list. Use before computing an order price or quantity; use List Trading Pairs to find pairs. A rule the pair does not define is null. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    symbol: symbolProp,
  },
  outputSchema: getTradingPairRulesOutputSchema,
  async run(context) {
    const symbol = binanceInput.symbol({ value: context.propsValue.symbol });
    const info = await binanceClient.get<ExchangeInfoResponse>({
      path: '/exchangeInfo',
      queryParams: { symbol, showPermissionSets: 'false' },
      subject: `the trading pair "${symbol}"`,
    });
    const pair = info.symbols.find((item) => item.symbol === symbol);
    if (pair === undefined) {
      throw new Error(`Binance returned no trading rules for ${symbol}.`);
    }
    return {
      ...exchangeInfo.toPairSummary({ pair }),
      tickSize: exchangeInfo.filterValue({ pair, filterTypes: ['PRICE_FILTER'], field: 'tickSize' }),
      minPrice: exchangeInfo.filterValue({ pair, filterTypes: ['PRICE_FILTER'], field: 'minPrice' }),
      maxPrice: exchangeInfo.filterValue({ pair, filterTypes: ['PRICE_FILTER'], field: 'maxPrice' }),
      stepSize: exchangeInfo.filterValue({ pair, filterTypes: ['LOT_SIZE'], field: 'stepSize' }),
      minQty: exchangeInfo.filterValue({ pair, filterTypes: ['LOT_SIZE'], field: 'minQty' }),
      maxQty: exchangeInfo.filterValue({ pair, filterTypes: ['LOT_SIZE'], field: 'maxQty' }),
      minNotional: exchangeInfo.filterValue({ pair, filterTypes: ['NOTIONAL', 'MIN_NOTIONAL'], field: 'minNotional' }),
      maxNotional: exchangeInfo.filterValue({ pair, filterTypes: ['NOTIONAL'], field: 'maxNotional' }),
      filters: pair.filters ?? [],
    };
  },
});

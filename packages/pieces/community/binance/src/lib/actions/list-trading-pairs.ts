import { createAction, Property } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { exchangeInfo, ExchangeInfoResponse } from '../common/exchange-info';
import { binanceInput } from '../common/input';
import { listTradingPairsOutputSchema } from '../output-schemas';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1500;

export const listTradingPairs = createAction({
  name: 'list_trading_pairs',
  classification: 'SEARCH',
  displayName: 'List Trading Pairs',
  description: 'List the Binance pairs open for spot trading right now (status TRADING and spot trading allowed), optionally filtered by base or quote asset.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Binance pairs that are open for spot trading right now (status TRADING and spot trading allowed; pairs only open for margin are left out), optionally only those with a given quote asset (such as USDT) and/or base asset (such as BTC). Use to find the exact symbol to pass to the price, ticker, order book, trade or candle actions; use Get Trading Pair Rules for one pair\'s tick size and minimum order. Returns at most the requested number of pairs (default 100, max 1500) plus the total match count and a truncated flag; narrow with the asset filters when truncated. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    quote_asset: Property.ShortText({
      displayName: 'Quote Asset',
      description: 'Optional. Only pairs priced in this asset, for example USDT, BTC or EUR. Not case-sensitive.',
      required: false,
    }),
    base_asset: Property.ShortText({
      displayName: 'Base Asset',
      description: 'Optional. Only pairs that trade this asset, for example BTC or ETH. Not case-sensitive.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Maximum Pairs',
      description: `Most pairs to return, 1 to ${MAX_LIMIT}. Defaults to ${DEFAULT_LIMIT}. The output also says how many pairs matched in total.`,
      required: false,
      defaultValue: DEFAULT_LIMIT,
    }),
  },
  outputSchema: listTradingPairsOutputSchema,
  async run(context) {
    const { propsValue } = context;
    const quoteAsset = optionalAsset({ value: propsValue.quote_asset, fieldName: 'Quote Asset' });
    const baseAsset = optionalAsset({ value: propsValue.base_asset, fieldName: 'Base Asset' });
    const limit = binanceInput.limit({ value: propsValue.limit, min: 1, max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT, fieldName: 'Maximum Pairs' });
    const info = await binanceClient.get<ExchangeInfoResponse>({
      path: '/exchangeInfo',
      queryParams: { symbolStatus: 'TRADING', showPermissionSets: 'false' },
      timeoutMs: binanceClient.SLOW_TIMEOUT_MS,
    });
    const matches = info.symbols.filter(
      (pair) =>
        exchangeInfo.isOpenForSpotTrading({ pair }) &&
        (quoteAsset === undefined || pair.quoteAsset.toUpperCase() === quoteAsset) &&
        (baseAsset === undefined || pair.baseAsset.toUpperCase() === baseAsset)
    );
    const pairs = matches.slice(0, limit).map((pair) => exchangeInfo.toPairSummary({ pair }));
    return {
      pairs,
      count: pairs.length,
      total: matches.length,
      truncated: matches.length > pairs.length,
    };
  },
});

function optionalAsset({ value, fieldName }: { value: unknown; fieldName: string }): string | undefined {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }
  return binanceInput.symbol({ value, fieldName });
}

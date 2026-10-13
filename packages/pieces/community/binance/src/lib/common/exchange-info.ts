function toPairSummary({ pair }: { pair: BinanceSymbolInfo }): PairSummary {
  return {
    symbol: pair.symbol,
    status: pair.status,
    baseAsset: pair.baseAsset,
    quoteAsset: pair.quoteAsset,
    baseAssetPrecision: pair.baseAssetPrecision,
    quoteAssetPrecision: pair.quoteAssetPrecision,
    isSpotTradingAllowed: pair.isSpotTradingAllowed,
    isMarginTradingAllowed: pair.isMarginTradingAllowed,
    orderTypes: Array.isArray(pair.orderTypes) ? pair.orderTypes.join(', ') : '',
  };
}

function filterValue({ pair, filterTypes, field }: { pair: BinanceSymbolInfo; filterTypes: string[]; field: string }): string | null {
  for (const filterType of filterTypes) {
    const filter = (pair.filters ?? []).find((item) => item.filterType === filterType);
    const value: unknown = filter === undefined ? undefined : filter[field];
    if (typeof value === 'string') {
      return value;
    }
  }
  return null;
}

function isOpenForSpotTrading({ pair }: { pair: BinanceSymbolInfo }): boolean {
  return pair.status === 'TRADING' && pair.isSpotTradingAllowed === true;
}

export const exchangeInfo = {
  toPairSummary,
  filterValue,
  isOpenForSpotTrading,
};

export type BinanceSymbolInfo = {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  orderTypes?: string[];
  filters?: ({ filterType: string } & Record<string, unknown>)[];
};

export type ExchangeInfoResponse = {
  symbols: BinanceSymbolInfo[];
};

type PairSummary = {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  orderTypes: string;
};

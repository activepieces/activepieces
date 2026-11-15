import { OutputSchema } from '@activepieces/pieces-framework';

const symbolField: OutputSchema['fields'][number] = {
  key: 'symbol',
  label: 'Symbol',
  description: 'Trading pair symbol, base asset followed by quote asset (for example BTCUSDT).',
};

const priceFields: OutputSchema['fields'] = [
  symbolField,
  { key: 'price', label: 'Price', description: 'Latest trade price as an exact decimal string, in the quote asset.' },
];

const changeFields: OutputSchema['fields'] = [
  { key: 'priceChange', label: 'Price Change', description: 'Last price minus open price, exact decimal string.' },
  { key: 'priceChangePercent', label: 'Price Change %', description: 'Price change in percent, exact decimal string.' },
  { key: 'weightedAvgPrice', label: 'Weighted Average Price', description: 'Quote volume divided by volume.' },
];

const marketFields: OutputSchema['fields'] = [
  { key: 'openPrice', label: 'Open Price' },
  { key: 'highPrice', label: 'High Price' },
  { key: 'lowPrice', label: 'Low Price' },
  { key: 'lastPrice', label: 'Last Price' },
  { key: 'volume', label: 'Volume', description: 'Traded amount in the base asset.' },
  { key: 'quoteVolume', label: 'Quote Volume', description: 'Traded amount in the quote asset.' },
  { key: 'openTime', label: 'Open Time', description: 'Window start, epoch milliseconds (UTC).' },
  { key: 'closeTime', label: 'Close Time', description: 'Window end, epoch milliseconds (UTC).' },
  { key: 'firstId', label: 'First Trade ID', description: '-1 when there were no trades.' },
  { key: 'lastId', label: 'Last Trade ID', description: '-1 when there were no trades.' },
  { key: 'count', label: 'Trade Count', format: 'number' },
];

const fullOnlyTickerFields: OutputSchema['fields'] = [
  ...changeFields,
  { key: 'prevClosePrice', label: 'Previous Close Price' },
  { key: 'lastQty', label: 'Last Quantity' },
  { key: 'bidPrice', label: 'Best Bid Price' },
  { key: 'bidQty', label: 'Best Bid Quantity' },
  { key: 'askPrice', label: 'Best Ask Price' },
  { key: 'askQty', label: 'Best Ask Quantity' },
].map((field) => ({ ...field, description: `${field.description ?? ''} Full detail level only.`.trim() }));

const levelFields: OutputSchema['fields'] = [
  { key: 'price', label: 'Price' },
  { key: 'quantity', label: 'Quantity', description: 'Amount in the base asset at this price level.' },
];

const tradeFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Trade ID' },
  { key: 'price', label: 'Price' },
  { key: 'qty', label: 'Quantity', description: 'Amount in the base asset.' },
  { key: 'quoteQty', label: 'Quote Quantity', description: 'Amount in the quote asset.' },
  { key: 'time', label: 'Time', description: 'Trade time, epoch milliseconds (UTC).' },
  { key: 'isBuyerMaker', label: 'Buyer Is Maker', format: 'boolean', description: 'True when the buyer\'s order was resting on the book (a sell hit it).' },
  { key: 'isBestMatch', label: 'Best Price Match', format: 'boolean' },
];

const candleFields: OutputSchema['fields'] = [
  { key: 'openTime', label: 'Open Time', description: 'Candle start, epoch milliseconds (UTC).' },
  { key: 'open', label: 'Open' },
  { key: 'high', label: 'High' },
  { key: 'low', label: 'Low' },
  { key: 'close', label: 'Close' },
  { key: 'volume', label: 'Volume', description: 'Traded amount in the base asset.' },
  { key: 'closeTime', label: 'Close Time', description: 'Candle end, epoch milliseconds (UTC).' },
  { key: 'quoteVolume', label: 'Quote Volume', description: 'Traded amount in the quote asset.' },
  { key: 'tradeCount', label: 'Trade Count', format: 'number' },
  { key: 'takerBuyBaseVolume', label: 'Taker Buy Volume', description: 'Base asset bought by takers.' },
  { key: 'takerBuyQuoteVolume', label: 'Taker Buy Quote Volume', description: 'Quote asset spent by takers buying.' },
];

const pairFields: OutputSchema['fields'] = [
  symbolField,
  { key: 'status', label: 'Status' },
  { key: 'baseAsset', label: 'Base Asset' },
  { key: 'quoteAsset', label: 'Quote Asset' },
  { key: 'baseAssetPrecision', label: 'Base Asset Precision', format: 'number' },
  { key: 'quoteAssetPrecision', label: 'Quote Asset Precision', format: 'number' },
  { key: 'isSpotTradingAllowed', label: 'Spot Trading Allowed', format: 'boolean' },
  { key: 'isMarginTradingAllowed', label: 'Margin Trading Allowed', format: 'boolean' },
  { key: 'orderTypes', label: 'Order Types', description: 'Comma-separated order types the pair accepts.' },
];

export const getPriceOutputSchema: OutputSchema = {
  fields: priceFields,
};

export const getMultiplePricesOutputSchema: OutputSchema = {
  fields: [
    { key: 'prices', label: 'Prices', labelKey: 'symbol', listItems: priceFields },
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'notTrading',
      label: 'Not Trading',
      description: 'Requested symbols that are listed but not trading right now, so they have no price.',
    },
  ],
};

export const get24hTickerOutputSchema: OutputSchema = {
  fields: [symbolField, ...fullOnlyTickerFields, ...marketFields],
};

export const getRollingWindowTickerOutputSchema: OutputSchema = {
  fields: [
    symbolField,
    { key: 'windowSize', label: 'Window Size' },
    ...changeFields,
    ...marketFields,
  ],
};

export const getAveragePriceOutputSchema: OutputSchema = {
  fields: [
    symbolField,
    { key: 'price', label: 'Average Price', description: 'Average price over the window, exact decimal string.' },
    { key: 'mins', label: 'Window (Minutes)', format: 'number' },
    { key: 'closeTime', label: 'Last Trade Time', description: 'Epoch milliseconds (UTC).' },
  ],
};

export const getOrderBookOutputSchema: OutputSchema = {
  fields: [
    symbolField,
    { key: 'lastUpdateId', label: 'Last Update ID' },
    { key: 'bids', label: 'Bids', labelKey: 'price', description: 'Buy orders, highest price first.', listItems: levelFields },
    { key: 'asks', label: 'Asks', labelKey: 'price', description: 'Sell orders, lowest price first.', listItems: levelFields },
  ],
};

export const getRecentTradesOutputSchema: OutputSchema = {
  fields: [
    symbolField,
    { key: 'trades', label: 'Trades', labelKey: 'id', description: 'Oldest first.', listItems: tradeFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const getCandlesOutputSchema: OutputSchema = {
  fields: [
    symbolField,
    { key: 'interval', label: 'Interval' },
    { key: 'candles', label: 'Candles', labelKey: 'openTime', description: 'Oldest first.', listItems: candleFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True when a start time was given and more candles follow the last one.' },
    { key: 'nextStartTime', label: 'Next Start Time', description: 'Start time for the next call when Has More is true, epoch milliseconds; otherwise null.' },
  ],
};

export const listTradingPairsOutputSchema: OutputSchema = {
  fields: [
    { key: 'pairs', label: 'Trading Pairs', labelKey: 'symbol', listItems: pairFields },
    { key: 'count', label: 'Returned', format: 'number' },
    { key: 'total', label: 'Total Matches', format: 'number' },
    { key: 'truncated', label: 'Truncated', format: 'boolean', description: 'True when more pairs matched than were returned.' },
  ],
};

export const getTradingPairRulesOutputSchema: OutputSchema = {
  fields: [
    ...pairFields,
    { key: 'tickSize', label: 'Tick Size', description: 'Smallest price step (PRICE_FILTER). Null when the pair has no such rule.' },
    { key: 'minPrice', label: 'Minimum Price', description: 'PRICE_FILTER. Null when not defined.' },
    { key: 'maxPrice', label: 'Maximum Price', description: 'PRICE_FILTER. Null when not defined.' },
    { key: 'stepSize', label: 'Quantity Step Size', description: 'Smallest quantity step (LOT_SIZE). Null when not defined.' },
    { key: 'minQty', label: 'Minimum Quantity', description: 'LOT_SIZE. Null when not defined.' },
    { key: 'maxQty', label: 'Maximum Quantity', description: 'LOT_SIZE. Null when not defined.' },
    { key: 'minNotional', label: 'Minimum Order Value', description: 'NOTIONAL filter (or the older MIN_NOTIONAL), in the quote asset. Null when not defined.' },
    { key: 'maxNotional', label: 'Maximum Order Value', description: 'NOTIONAL, in the quote asset. Null when not defined.' },
    { key: 'filters', label: 'All Filters', description: 'Every Binance filter object for the pair, keyed by filterType.' },
  ],
};

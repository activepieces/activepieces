import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BASE, errorOf, fail, ok, request, runAction, sendRequest } from './helpers';
import { binance } from '../src';
import { fetchCryptoPairPrice } from '../src/lib/actions/fetch-pair-price';
import { binanceGetPrice } from '../src/lib/actions/get-price';
import { getMultiplePrices } from '../src/lib/actions/get-multiple-prices';
import { get24hTicker } from '../src/lib/actions/get-24h-ticker';
import { getRollingWindowTicker } from '../src/lib/actions/get-rolling-window-ticker';
import { getAveragePrice } from '../src/lib/actions/get-average-price';
import { getOrderBook } from '../src/lib/actions/get-order-book';
import { getRecentTrades } from '../src/lib/actions/get-recent-trades';
import { getCandles } from '../src/lib/actions/get-candles';
import { listTradingPairs } from '../src/lib/actions/list-trading-pairs';
import { getTradingPairRules } from '../src/lib/actions/get-trading-pair-rules';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
});

beforeEach(() => {
  sendRequest.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

const KLINE = [1790827200000, '83754.01000000', '84207.53000000', '83720.40000000', '84110.01000000', '514.62822000', 1790830799999, '43188989.25964940', 97798, '294.70729000', '24735482.67867050', '0'];

function kline({ openTime, closeTime }: { openTime: number; closeTime: number }) {
  return [openTime, '1.0', '2.0', '0.5', '1.5', '10.0', closeTime, '15.0', 3, '4.0', '6.0', '0'];
}

function pair({
  symbol,
  baseAsset,
  quoteAsset,
  filters = [],
  status = 'TRADING',
  isSpotTradingAllowed = true,
  isMarginTradingAllowed = false,
}: {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  filters?: unknown[];
  status?: string;
  isSpotTradingAllowed?: boolean;
  isMarginTradingAllowed?: boolean;
}) {
  return {
    symbol,
    status,
    baseAsset,
    quoteAsset,
    baseAssetPrecision: 8,
    quoteAssetPrecision: 8,
    isSpotTradingAllowed,
    isMarginTradingAllowed,
    orderTypes: ['LIMIT', 'MARKET'],
    filters,
    permissionSets: [],
  };
}

describe('piece wiring', () => {
  it('registers all 11 actions with the expected audience and metadata', () => {
    const actions = binance.actions();
    expect(Object.keys(actions)).toHaveLength(11);
    for (const action of Object.values(actions)) {
      expect(action.aiMetadata?.description).toBeTruthy();
      expect(action.aiMetadata?.idempotent).toBe(true);
      expect(['READ', 'SEARCH']).toContain(action.classification);
    }
    expect(actions['fetch_crypto_pair_price'].audience).toBe('human');
    expect(actions['binance_get_price'].audience).toBe('ai');
    const others = Object.values(actions).filter((a) => a.name !== 'fetch_crypto_pair_price' && a.name !== 'binance_get_price');
    expect(others.every((a) => a.audience === 'both')).toBe(true);
    expect(Object.values(actions).filter((a) => a.outputSchema !== undefined)).toHaveLength(10);
    expect(actions['fetch_crypto_pair_price'].outputSchema).toBeUndefined();
    expect(binance.minimumSupportedRelease).toBe('0.88.2');
  });
});

describe('fetch_crypto_pair_price (existing action)', () => {
  it('calls the market-data host with the symbol as a query param and returns a number', async () => {
    ok({ body: { symbol: 'BTCUSDT', price: '84182.69000000' } });
    const result = await runAction({ action: fetchCryptoPairPrice, props: { first_coin: ' btc/ ', second_coin: ' usdt\n' } });
    expect(result).toBe(84182.69);
    expect(typeof result).toBe('number');
    expect(request()).toEqual({
      method: HttpMethod.GET,
      url: `${BASE}/ticker/price`,
      queryParams: { symbol: 'BTCUSDT' },
      timeout: 30000,
    });
  });

  it('keeps non-ASCII symbols intact for the client to encode', async () => {
    ok({ body: { symbol: '币安人生USDT', price: '0.50490000' } });
    expect(await runAction({ action: fetchCryptoPairPrice, props: { first_coin: '币安人生', second_coin: 'USDT' } })).toBe(0.5049);
    expect(request().queryParams).toEqual({ symbol: '币安人生USDT' });
  });

  it('fails before any request when a coin is blank', async () => {
    const error = await errorOf(runAction({ action: fetchCryptoPairPrice, props: { first_coin: ' ', second_coin: 'USDT' } }));
    expect(error.message).toBe('First Coin Symbol is required, for example BTCUSDT.');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('throws instead of returning NaN when the body has no price', async () => {
    ok({ body: { symbol: 'BTCUSDT' } });
    const error = await errorOf(runAction({ action: fetchCryptoPairPrice, props: { first_coin: 'BTC', second_coin: 'USDT' } }));
    expect(error.message).toBe('Binance returned no price for BTCUSDT.');
  });

  it('maps an unknown pair to a readable error', async () => {
    fail({ status: 400, body: { code: -1121, msg: 'Invalid symbol.' } });
    const error = await errorOf(runAction({ action: fetchCryptoPairPrice, props: { first_coin: 'FOO', second_coin: 'BAR' } }));
    expect(error.message).toContain('Binance does not list the trading pair "FOOBAR"');
  });
});

describe('request building per action', () => {
  it('binance_get_price asks only for trading pairs and returns the exact string', async () => {
    ok({ body: { symbol: 'BTCUSDT', price: '84184.05000000' } });
    expect(await runAction({ action: binanceGetPrice, props: { symbol: 'btc/usdt' } })).toEqual({ symbol: 'BTCUSDT', price: '84184.05000000' });
    expect(request()).toEqual({
      method: HttpMethod.GET,
      url: `${BASE}/ticker/price`,
      queryParams: { symbol: 'BTCUSDT', symbolStatus: 'TRADING' },
      timeout: 30000,
    });
  });

  it('get_multiple_prices sends a JSON array, keeps input order and reports non-trading pairs', async () => {
    ok({ body: [{ symbol: 'ETHUSDT', price: '2714.63000000' }, { symbol: 'BTCUSDT', price: '84184.05000000' }] });
    const result = await runAction({ action: getMultiplePrices, props: { symbols: ['btcusdt', 'ETH/USDT', 'BCCBTC', 'BTC USDT'] } });
    expect(request().queryParams).toEqual({ symbols: '["BTCUSDT","ETHUSDT","BCCBTC"]', symbolStatus: 'TRADING' });
    expect(result).toEqual({
      prices: [
        { symbol: 'BTCUSDT', price: '84184.05000000' },
        { symbol: 'ETHUSDT', price: '2714.63000000' },
      ],
      count: 2,
      notTrading: ['BCCBTC'],
    });
  });

  it('get_multiple_prices rejects 101 symbols before any request', async () => {
    const symbols = Array.from({ length: 101 }, (_, i) => `S${i}USDT`);
    const error = await errorOf(runAction({ action: getMultiplePrices, props: { symbols } }));
    expect(error.message).toContain('at most 100 symbols');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('get_24h_ticker defaults to FULL and passes MINI through', async () => {
    ok({ body: { symbol: 'BTCUSDT', lastPrice: '1' } });
    await runAction({ action: get24hTicker, props: { symbol: 'BTCUSDT' } });
    expect(request(0)).toEqual({ method: HttpMethod.GET, url: `${BASE}/ticker/24hr`, queryParams: { symbol: 'BTCUSDT', type: 'FULL' }, timeout: 30000 });
    ok({ body: { symbol: 'BTCUSDT', lastPrice: '1' } });
    await runAction({ action: get24hTicker, props: { symbol: 'BTCUSDT', type: 'MINI' } });
    expect(request(1).queryParams).toEqual({ symbol: 'BTCUSDT', type: 'MINI' });
  });

  it('get_24h_ticker rejects an unknown detail level', async () => {
    const error = await errorOf(runAction({ action: get24hTicker, props: { symbol: 'BTCUSDT', type: 'HUGE' } }));
    expect(error.message).toBe('Detail Level must be FULL or MINI.');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('get_rolling_window_ticker defaults to 1h, normalises 01h and adds windowSize to the output', async () => {
    ok({ body: { symbol: 'BTCUSDT', priceChange: '1.0' } });
    expect(await runAction({ action: getRollingWindowTicker, props: { symbol: 'BTCUSDT' } })).toEqual({ symbol: 'BTCUSDT', priceChange: '1.0', windowSize: '1h' });
    expect(request(0)).toEqual({ method: HttpMethod.GET, url: `${BASE}/ticker`, queryParams: { symbol: 'BTCUSDT', windowSize: '1h' }, timeout: 30000 });
    ok({ body: { symbol: 'BTCUSDT' } });
    await runAction({ action: getRollingWindowTicker, props: { symbol: 'BTCUSDT', window_size: '01h' } });
    expect(request(1).queryParams.windowSize).toBe('1h');
  });

  it('get_rolling_window_ticker rejects 9d before any request', async () => {
    const error = await errorOf(runAction({ action: getRollingWindowTicker, props: { symbol: 'BTCUSDT', window_size: '9d' } }));
    expect(error.message).toContain('Window size "9d" is not valid');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('get_average_price adds the symbol', async () => {
    ok({ body: { mins: 5, price: '84275.08798119', closeTime: 1790836396722 } });
    expect(await runAction({ action: getAveragePrice, props: { symbol: 'BTCUSDT' } })).toEqual({ symbol: 'BTCUSDT', mins: 5, price: '84275.08798119', closeTime: 1790836396722 });
    expect(request()).toEqual({ method: HttpMethod.GET, url: `${BASE}/avgPrice`, queryParams: { symbol: 'BTCUSDT' }, timeout: 30000 });
  });

  it('get_order_book defaults to depth 20, accepts a numeric string and maps tuples', async () => {
    ok({ body: { lastUpdateId: 7, bids: [['84184.04000000', '0.10457000']], asks: [['84184.05000000', '1.00000000']] } });
    expect(await runAction({ action: getOrderBook, props: { symbol: 'BTCUSDT' } })).toEqual({
      symbol: 'BTCUSDT',
      lastUpdateId: 7,
      bids: [{ price: '84184.04000000', quantity: '0.10457000' }],
      asks: [{ price: '84184.05000000', quantity: '1.00000000' }],
    });
    expect(request(0)).toEqual({ method: HttpMethod.GET, url: `${BASE}/depth`, queryParams: { symbol: 'BTCUSDT', limit: '20' }, timeout: 30000 });
    ok({ body: { lastUpdateId: 7, bids: [], asks: [] } });
    await runAction({ action: getOrderBook, props: { symbol: 'BTCUSDT', limit: '5000' } });
    expect(request(1).queryParams.limit).toBe('5000');
  });

  it.each([0, 5001, 2.5])('get_order_book rejects depth %j before any request', async (limit) => {
    await errorOf(runAction({ action: getOrderBook, props: { symbol: 'BTCUSDT', limit } }));
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('get_recent_trades defaults to 50 and returns the trades with a count', async () => {
    const trade = { id: 1, price: '1', qty: '2', quoteQty: '2', time: 3, isBuyerMaker: true, isBestMatch: true };
    ok({ body: [trade] });
    expect(await runAction({ action: getRecentTrades, props: { symbol: 'BTCUSDT' } })).toEqual({ symbol: 'BTCUSDT', trades: [trade], count: 1 });
    expect(request()).toEqual({ method: HttpMethod.GET, url: `${BASE}/trades`, queryParams: { symbol: 'BTCUSDT', limit: '50' }, timeout: 30000 });
  });

  it.each([0, 1001])('get_recent_trades rejects %j before any request', async (limit) => {
    await errorOf(runAction({ action: getRecentTrades, props: { symbol: 'BTCUSDT', limit } }));
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('get_candles', () => {
  it('sends only the params that are set, with a longer timeout, and names the tuple fields', async () => {
    ok({ body: [KLINE] });
    const result = await runAction({ action: getCandles, props: { symbol: 'BTCUSDT', interval: '1h' } });
    expect(request()).toEqual({
      method: HttpMethod.GET,
      url: `${BASE}/klines`,
      queryParams: { symbol: 'BTCUSDT', interval: '1h', limit: '100' },
      timeout: 60000,
    });
    expect(result).toEqual({
      symbol: 'BTCUSDT',
      interval: '1h',
      candles: [
        {
          openTime: 1790827200000,
          open: '83754.01000000',
          high: '84207.53000000',
          low: '83720.40000000',
          close: '84110.01000000',
          volume: '514.62822000',
          closeTime: 1790830799999,
          quoteVolume: '43188989.25964940',
          tradeCount: 97798,
          takerBuyBaseVolume: '294.70729000',
          takerBuyQuoteVolume: '24735482.67867050',
        },
      ],
      count: 1,
      hasMore: false,
      nextStartTime: null,
    });
  });

  it('passes the range and time zone through', async () => {
    ok({ body: [] });
    await runAction({
      action: getCandles,
      props: { symbol: 'BTCUSDT', interval: '1M', start_time: '2026-09-20T00:00:00.000Z', end_time: '2026-09-22T00:00:00.000Z', time_zone: '05:45', limit: 10 },
    });
    expect(request().queryParams).toEqual({
      symbol: 'BTCUSDT',
      interval: '1M',
      limit: '10',
      startTime: String(Date.UTC(2026, 8, 20)),
      endTime: String(Date.UTC(2026, 8, 22)),
      timeZone: '05:45',
    });
  });

  it('reports hasMore and the next start time when a full page ends before the range end', async () => {
    const hour = 3600000;
    const start = Date.UTC(2026, 8, 20);
    ok({ body: [kline({ openTime: start, closeTime: start + hour - 1 }), kline({ openTime: start + hour, closeTime: start + 2 * hour - 1 })] });
    const result = await runAction({
      action: getCandles,
      props: { symbol: 'BTCUSDT', interval: '1h', start_time: start, end_time: start + 48 * hour, limit: 2 },
    });
    expect(result).toMatchObject({ count: 2, hasMore: true, nextStartTime: start + 2 * hour });
  });

  it('says no more when the page is short or reaches the range end', async () => {
    const hour = 3600000;
    const start = Date.UTC(2026, 8, 20);
    ok({ body: [kline({ openTime: start, closeTime: start + hour - 1 })] });
    expect(await runAction({ action: getCandles, props: { symbol: 'BTCUSDT', interval: '1h', start_time: start, limit: 2 } })).toMatchObject({ hasMore: false, nextStartTime: null });
    ok({ body: [kline({ openTime: start, closeTime: start + hour - 1 })] });
    expect(
      await runAction({ action: getCandles, props: { symbol: 'BTCUSDT', interval: '1h', start_time: start, end_time: start + hour - 1, limit: 1 } })
    ).toMatchObject({ hasMore: false });
  });

  it('never claims more for the most-recent mode (no start time)', async () => {
    ok({ body: [KLINE] });
    expect(await runAction({ action: getCandles, props: { symbol: 'BTCUSDT', interval: '1h', limit: 1 } })).toMatchObject({ hasMore: false, nextStartTime: null });
  });

  it.each([
    [{ interval: '1H' }, 'Interval "1H" is not valid'],
    [{ interval: '1h', start_time: '2026-09-22T00:00:00Z', end_time: '2026-09-20T00:00:00Z' }, 'Start Time must be earlier than End Time.'],
    [{ interval: '1h', time_zone: '14:30' }, 'Time zone "14:30" is not valid'],
    [{ interval: '1h', limit: 1001 }, 'Number of Candles must be between 1 and 1000'],
    [{ interval: '1h', start_time: 'soon' }, 'Start Time must be a date'],
  ])('rejects %j before any request', async (props, message) => {
    const error = await errorOf(runAction({ action: getCandles, props: { symbol: 'BTCUSDT', ...props } }));
    expect(error.message).toContain(message);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('list_trading_pairs', () => {
  const symbols = [
    pair({ symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' }),
    pair({ symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' }),
    pair({ symbol: 'ETHBTC', baseAsset: 'ETH', quoteAsset: 'BTC' }),
    pair({ symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' }),
  ];

  it('requests TRADING pairs without permission sets and returns slim rows', async () => {
    ok({ body: { symbols } });
    const result = await runAction({ action: listTradingPairs, props: {} });
    expect(request()).toEqual({
      method: HttpMethod.GET,
      url: `${BASE}/exchangeInfo`,
      queryParams: { symbolStatus: 'TRADING', showPermissionSets: 'false' },
      timeout: 60000,
    });
    expect(result).toMatchObject({ count: 4, total: 4, truncated: false });
    expect(result).toMatchObject({
      pairs: [
        {
          symbol: 'BTCUSDT',
          status: 'TRADING',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          baseAssetPrecision: 8,
          quoteAssetPrecision: 8,
          isSpotTradingAllowed: true,
          isMarginTradingAllowed: false,
          orderTypes: 'LIMIT, MARKET',
        },
        { symbol: 'ETHUSDT' },
        { symbol: 'ETHBTC' },
        { symbol: 'BNBUSDT' },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('filters');
    expect(JSON.stringify(result)).not.toContain('permissionSets');
  });

  it('filters by quote and base asset case-insensitively', async () => {
    ok({ body: { symbols } });
    const result = await runAction({ action: listTradingPairs, props: { quote_asset: ' usdt ', base_asset: 'eth' } });
    expect(result).toMatchObject({ count: 1, total: 1, truncated: false, pairs: [{ symbol: 'ETHUSDT' }] });
  });

  it('caps the rows and says so', async () => {
    ok({ body: { symbols } });
    expect(await runAction({ action: listTradingPairs, props: { quote_asset: 'USDT', limit: 2 } })).toMatchObject({ count: 2, total: 3, truncated: true });
  });

  it('leaves out pairs that are not open for spot trading and keeps the total in step', async () => {
    ok({
      body: {
        symbols: [
          pair({ symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' }),
          pair({ symbol: 'MARGINUSDT', baseAsset: 'MARGIN', quoteAsset: 'USDT', isSpotTradingAllowed: false, isMarginTradingAllowed: true }),
          pair({ symbol: 'HALTUSDT', baseAsset: 'HALT', quoteAsset: 'USDT', status: 'BREAK' }),
          pair({ symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' }),
        ],
      },
    });
    const result = await runAction({ action: listTradingPairs, props: { quote_asset: 'USDT', limit: 1 } });
    expect(result).toMatchObject({ count: 1, total: 2, truncated: true, pairs: [{ symbol: 'BTCUSDT' }] });
    expect(JSON.stringify(result)).not.toContain('MARGINUSDT');
    expect(JSON.stringify(result)).not.toContain('HALTUSDT');
  });

  it.each([0, 1501])('rejects limit %j before any request', async (limit) => {
    await errorOf(runAction({ action: listTradingPairs, props: { limit } }));
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('get_trading_pair_rules', () => {
  it('flattens the price, lot size and notional filters', async () => {
    const filters = [
      { filterType: 'PRICE_FILTER', minPrice: '0.01000000', maxPrice: '1000000.00000000', tickSize: '0.01000000' },
      { filterType: 'LOT_SIZE', minQty: '0.00001000', maxQty: '9000.00000000', stepSize: '0.00001000' },
      { filterType: 'NOTIONAL', minNotional: '5.00000000', maxNotional: '9000000.00000000' },
    ];
    ok({ body: { symbols: [pair({ symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', filters })] } });
    const result = await runAction({ action: getTradingPairRules, props: { symbol: 'btcusdt' } });
    expect(request()).toEqual({
      method: HttpMethod.GET,
      url: `${BASE}/exchangeInfo`,
      queryParams: { symbol: 'BTCUSDT', showPermissionSets: 'false' },
      timeout: 30000,
    });
    expect(result).toMatchObject({
      symbol: 'BTCUSDT',
      tickSize: '0.01000000',
      minPrice: '0.01000000',
      maxPrice: '1000000.00000000',
      stepSize: '0.00001000',
      minQty: '0.00001000',
      maxQty: '9000.00000000',
      minNotional: '5.00000000',
      maxNotional: '9000000.00000000',
      filters,
    });
  });

  it('reads the minimum order value from the older MIN_NOTIONAL filter when NOTIONAL is absent', async () => {
    const filters = [{ filterType: 'MIN_NOTIONAL', minNotional: '10.00000000', applyToMarket: true, avgPriceMins: 5 }];
    ok({ body: { symbols: [pair({ symbol: 'OLDUSDT', baseAsset: 'OLD', quoteAsset: 'USDT', filters })] } });
    expect(await runAction({ action: getTradingPairRules, props: { symbol: 'OLDUSDT' } })).toMatchObject({ minNotional: '10.00000000', maxNotional: null, filters });
  });

  it('prefers NOTIONAL over MIN_NOTIONAL when both are present', async () => {
    const filters = [
      { filterType: 'MIN_NOTIONAL', minNotional: '10.00000000', applyToMarket: true, avgPriceMins: 5 },
      { filterType: 'NOTIONAL', minNotional: '5.00000000', applyMinToMarket: true, maxNotional: '9000000.00000000', applyMaxToMarket: false, avgPriceMins: 5 },
    ];
    ok({ body: { symbols: [pair({ symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', filters })] } });
    expect(await runAction({ action: getTradingPairRules, props: { symbol: 'BTCUSDT' } })).toMatchObject({ minNotional: '5.00000000', maxNotional: '9000000.00000000' });
  });

  it('returns null for rules the pair does not define', async () => {
    ok({ body: { symbols: [pair({ symbol: 'XUSDT', baseAsset: 'X', quoteAsset: 'USDT' })] } });
    expect(await runAction({ action: getTradingPairRules, props: { symbol: 'XUSDT' } })).toMatchObject({ tickSize: null, stepSize: null, minNotional: null, filters: [] });
  });

  it('fails when Binance returns no matching symbol', async () => {
    ok({ body: { symbols: [] } });
    const error = await errorOf(runAction({ action: getTradingPairRules, props: { symbol: 'XUSDT' } }));
    expect(error.message).toBe('Binance returned no trading rules for XUSDT.');
  });
});

describe('error mapping', () => {
  async function failWith({ status, body }: { status: number; body?: unknown }) {
    fail({ status, body });
    return errorOf(runAction({ action: binanceGetPrice, props: { symbol: 'BTCUSDT' } }));
  }

  it('400 -1121 names the pair and points to List Trading Pairs', async () => {
    const error = await failWith({ status: 400, body: { code: -1121, msg: 'Invalid symbol.' } });
    expect(error.message).toContain('Binance does not list the trading pair "BTCUSDT"');
    expect(error.message).toContain('List Trading Pairs');
    expect(error).toMatchObject({ name: 'BinanceApiError', status: 400, code: -1121, responseBody: { code: -1121, msg: 'Invalid symbol.' } });
    expect(Object.keys(error)).not.toContain('body');
  });

  it('400 -1121 on the multi-price call lists the symbols', async () => {
    fail({ status: 400, body: { code: -1121, msg: 'Invalid symbol.' } });
    const error = await errorOf(runAction({ action: getMultiplePrices, props: { symbols: ['BTCUSDT', 'FOOBAR'] } }));
    expect(error.message).toContain('one or more of these symbols (BTCUSDT, FOOBAR)');
  });

  it('400 -1220 says the pair is not trading', async () => {
    const error = await failWith({ status: 400, body: { code: -1220, msg: "The symbol's status does not match the requested symbolStatus" } });
    expect(error.message).toBe('The trading pair "BTCUSDT" is listed on Binance but is not trading right now (halted or delisted), so it has no live price.');
  });

  it('other Binance codes keep the code and message', async () => {
    const error = await failWith({ status: 400, body: { code: -1100, msg: "Illegal characters found in parameter 'symbol'" } });
    expect(error.message).toBe("Binance rejected the request (HTTP 400, code -1100): Illegal characters found in parameter 'symbol'");
  });

  it('a JSON string body is parsed', async () => {
    const error = await failWith({ status: 400, body: '{"code":-1121,"msg":"Invalid symbol."}' });
    expect(error.message).toContain('does not list');
  });

  it.each([
    [429, 'rate limit reached (HTTP 429)'],
    [418, 'temporarily banned this server\'s IP address (HTTP 418)'],
    [451, 'blocks requests from the region this server runs in (HTTP 451)'],
    [403, "firewall rejected the request (HTTP 403)"],
    [502, 'server error (HTTP 502). This is a read-only request, so it is safe to retry.'],
  ])('HTTP %i is explained', async (status, text) => {
    const error = await failWith({ status, body: status === 429 ? { code: -1003, msg: 'Too much request weight used' } : '' });
    expect(error.message).toContain(text);
    expect(error).toMatchObject({ status });
  });

  it('an unexpected body still produces a readable message', async () => {
    const error = await failWith({ status: 404, body: '<html>Not Found</html>' });
    expect(error.message).toBe('Binance request failed (HTTP 404): <html>Not Found</html>');
  });

  it('a timeout is reported as such', async () => {
    const abort = new Error('This operation was aborted');
    abort.name = 'AbortError';
    sendRequest.mockRejectedValueOnce(abort);
    const error = await errorOf(runAction({ action: binanceGetPrice, props: { symbol: 'BTCUSDT' } }));
    expect(error.message).toBe('Binance did not answer within 30 seconds. This is a read-only request, so it is safe to retry.');
  });

  it('other errors are rethrown unchanged', async () => {
    const boom = new TypeError('fetch failed');
    sendRequest.mockRejectedValueOnce(boom);
    expect(await errorOf(runAction({ action: binanceGetPrice, props: { symbol: 'BTCUSDT' } }))).toBe(boom);
  });

  it('does not retry on its own', async () => {
    fail({ status: 429, body: { code: -1003, msg: 'Too much request weight used' } });
    await errorOf(runAction({ action: binanceGetPrice, props: { symbol: 'BTCUSDT' } }));
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request().retries).toBeUndefined();
  });
});

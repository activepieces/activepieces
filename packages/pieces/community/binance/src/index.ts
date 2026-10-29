import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { fetchCryptoPairPrice } from './lib/actions/fetch-pair-price';
import { binanceGetPrice } from './lib/actions/get-price';
import { getMultiplePrices } from './lib/actions/get-multiple-prices';
import { get24hTicker } from './lib/actions/get-24h-ticker';
import { getRollingWindowTicker } from './lib/actions/get-rolling-window-ticker';
import { getAveragePrice } from './lib/actions/get-average-price';
import { getOrderBook } from './lib/actions/get-order-book';
import { getRecentTrades } from './lib/actions/get-recent-trades';
import { getCandles } from './lib/actions/get-candles';
import { listTradingPairs } from './lib/actions/list-trading-pairs';
import { getTradingPairRules } from './lib/actions/get-trading-pair-rules';

export const binance = createPiece({
  displayName: 'Binance',
  description:
    'Get public Binance spot market data: prices, 24h statistics, order book, recent trades, candles and trading pairs. No API key needed.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/binance.png',
  categories: [],
  auth: PieceAuth.None(),
  actions: [
    fetchCryptoPairPrice,
    binanceGetPrice,
    getMultiplePrices,
    get24hTicker,
    getRollingWindowTicker,
    getAveragePrice,
    getOrderBook,
    getRecentTrades,
    getCandles,
    listTradingPairs,
    getTradingPairRules,
  ],
  authors: ["kishanprmr","khaledmashaly","abuaboud"],
  triggers: [],
});

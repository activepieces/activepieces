import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getMarkets } from './actions/get-markets';
import { getMarketOrderbook } from './actions/get-market-orderbook';
import { getMarketTrades } from './actions/get-market-trades';
import { getAccountPositions } from './actions/get-account-positions';
import { getCandles } from './actions/get-candles';

export const dydx = createPiece({
  displayName: 'dYdX',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dydx.png',
  authors: ['bossco7598'],
  actions: [getMarkets, getMarketOrderbook, getMarketTrades, getAccountPositions, getCandles],
  triggers: [],
});

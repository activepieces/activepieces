import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getCoinTicker } from './lib/actions/get-coin-ticker';
import { getAllTickers } from './lib/actions/get-all-tickers';
import { getCoinInfo } from './lib/actions/get-coin-info';
import { getGlobalMarket } from './lib/actions/get-global-market';
import { getCoinOhlcv } from './lib/actions/get-coin-ohlcv';

export const coinpaprikaAuth = PieceAuth.SecretText({
  displayName: 'API Key (Optional)',
  required: false,
  description:
    'Optional API key for higher rate limits. Leave empty to use the free tier without authentication.',
});

export const coinpaprika = createPiece({
  displayName: 'CoinPaprika',
  description:
    'Free cryptocurrency market data including prices, market cap, OHLCV, and global market overview via the CoinPaprika API.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/coinpaprika.png',
  categories: [PieceCategory.FINANCE],
  auth: coinpaprikaAuth,
  actions: [
    getCoinTicker,
    getAllTickers,
    getCoinInfo,
    getGlobalMarket,
    getCoinOhlcv,
  ],
  authors: ['bossco7598'],
  triggers: [],
});

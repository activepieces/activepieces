import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getCoin } from './lib/actions/get-coin';
import { getCoinCharts } from './lib/actions/get-coin-charts';
import { getCoins } from './lib/actions/get-coins';
import { getMarkets } from './lib/actions/get-markets';
import { getNews } from './lib/actions/get-news';

export const coinstatsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Get your API key from https://openapiv1.coinstats.app',
  required: true,
});

export const coinStats = createPiece({
  displayName: 'CoinStats',
  auth: coinstatsAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/coinstats.png',
  authors: ['Bossco'],
  actions: [getCoin, getCoinCharts, getCoins, getMarkets, getNews],
  triggers: [],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
});

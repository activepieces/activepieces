import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getCoins } from './lib/actions/get-coins';
import { getCoinDetails } from './lib/actions/get-coin-details';
import { getCoinPriceHistory } from './lib/actions/get-coin-price-history';
import { getExchanges } from './lib/actions/get-exchanges';
import { searchCoins } from './lib/actions/search-coins';

export const coinrankingAuth = PieceAuth.SecretText({
  displayName: 'CoinRanking API Key',
  required: true,
  description:
    'Get your free API key at https://developers.coinranking.com/api/documentation. It will be sent as the x-access-token header.',
});

export const coinranking = createPiece({
  displayName: 'CoinRanking',
  description:
    'Access real-time and historical crypto market data including prices, market caps, volumes, exchanges, and coin details via the CoinRanking API.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/coinranking.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: coinrankingAuth,
  authors: ['bossco7598'],
  actions: [getCoins, getCoinDetails, getCoinPriceHistory, getExchanges, searchCoins],
  triggers: [],
});

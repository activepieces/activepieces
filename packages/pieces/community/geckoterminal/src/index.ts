import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getTrendingPoolsAction } from './lib/actions/get-trending-pools';
import { getPoolInfoAction } from './lib/actions/get-pool-info';
import { getPoolOhlcvAction } from './lib/actions/get-pool-ohlcv';
import { searchPoolsAction } from './lib/actions/search-pools';
import { getTokenPoolsAction } from './lib/actions/get-token-pools';

export const geckoterminal = createPiece({
  displayName: 'GeckoTerminal',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/geckoterminal.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getTrendingPoolsAction,
    getPoolInfoAction,
    getPoolOhlcvAction,
    searchPoolsAction,
    getTokenPoolsAction,
  ],
  triggers: [],
});

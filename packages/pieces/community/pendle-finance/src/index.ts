import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getMarkets } from './lib/actions/get-markets';
import { getMarketData } from './lib/actions/get-market-data';
import { getAssetPrice } from './lib/actions/get-asset-price';
import { getPendleTokenStats } from './lib/actions/get-pendle-token-stats';
import { getActivePools } from './lib/actions/get-active-pools';

export const pendleFinance = createPiece({
  displayName: 'Pendle Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pendle-finance.png',
  categories: [PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [getMarkets, getMarketData, getAssetPrice, getPendleTokenStats, getActivePools],
  triggers: [],
});

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { aaveAuth } from './lib/aave-auth';
import { getReservesAction } from './lib/actions/get-reserves';
import { getUserPositionsAction } from './lib/actions/get-user-positions';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';
import { getMarketRatesAction } from './lib/actions/get-market-rates';
import { getRateHistoryAction } from './lib/actions/get-rate-history';

export const aave = createPiece({
  displayName: 'Aave',
  auth: aaveAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/aave.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getReservesAction,
    getUserPositionsAction,
    getProtocolStatsAction,
    getMarketRatesAction,
    getRateHistoryAction,
  ],
  triggers: [],
});

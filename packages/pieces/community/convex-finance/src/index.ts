import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolStats } from './lib/actions/get-protocol-stats';
import { getCvxTokenStats } from './lib/actions/get-cvx-token-stats';
import { getCurvePools } from './lib/actions/get-curve-pools';
import { getConvexPoolApy } from './lib/actions/get-convex-pool-apy';
import { getCrvTokenStats } from './lib/actions/get-crv-token-stats';

export const convexFinance = createPiece({
  displayName: 'Convex Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/convex-finance.png',
  categories: [PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolStats,
    getCvxTokenStats,
    getCurvePools,
    getConvexPoolApy,
    getCrvTokenStats,
  ],
  triggers: [],
});

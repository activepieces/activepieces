import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getStakingStats } from './lib/actions/get-staking-stats';
import { getSynthSupply } from './lib/actions/get-synth-supply';
import { getFeePool } from './lib/actions/get-fee-pool';
import { getExchanges } from './lib/actions/get-exchanges';
import { getDebtSnapshot } from './lib/actions/get-debt-snapshot';

export const synthetix = createPiece({
  displayName: 'Synthetix',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/synthetix.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getStakingStats,
    getSynthSupply,
    getFeePool,
    getExchanges,
    getDebtSnapshot,
  ],
  triggers: [],
});

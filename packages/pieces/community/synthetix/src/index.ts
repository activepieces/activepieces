import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getSynthRates } from './lib/actions/get-synth-rates';
import { getSnxStakers } from './lib/actions/get-snx-stakers';
import { getExchangeStats } from './lib/actions/get-exchange-stats';
import { getIssuedSynths } from './lib/actions/get-issued-synths';
import { getFeePool } from './lib/actions/get-fee-pool';

export const synthetix = createPiece({
  displayName: 'Synthetix',
  description: 'Fetch synthetic asset rates, SNX staking data, and exchange statistics from the Synthetix protocol',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/synthetix.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  actions: [
    getSynthRates,
    getSnxStakers,
    getExchangeStats,
    getIssuedSynths,
    getFeePool,
  ],
  authors: ['bossco7598'],
  triggers: [],
});

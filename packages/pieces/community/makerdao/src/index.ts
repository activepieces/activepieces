import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolStats } from './lib/actions/get-protocol-stats';
import { getStabilityRates } from './lib/actions/get-stability-rates';
import { getCollateralTypes } from './lib/actions/get-collateral-types';
import { getDaiSupply } from './lib/actions/get-dai-supply';
import { getSurplusBuffer } from './lib/actions/get-surplus-buffer';

export const makerdao = createPiece({
  displayName: 'MakerDAO',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/makerdao.png',
  categories: [PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolStats,
    getStabilityRates,
    getCollateralTypes,
    getDaiSupply,
    getSurplusBuffer,
  ],
  triggers: [],
});

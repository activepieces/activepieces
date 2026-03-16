import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getBntPrice } from './lib/actions/get-bnt-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getPoolStats } from './lib/actions/get-pool-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const bancor = createPiece({
  displayName: 'Bancor',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bancor.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [getProtocolTvl, getBntPrice, getChainBreakdown, getPoolStats, getTvlHistory],
  triggers: [],
});

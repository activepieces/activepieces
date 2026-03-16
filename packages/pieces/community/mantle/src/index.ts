import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getMntPrice } from './lib/actions/get-mnt-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const mantle = createPiece({
  displayName: 'Mantle Network',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/mantle.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getMntPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});

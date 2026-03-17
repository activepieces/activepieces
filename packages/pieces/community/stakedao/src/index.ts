import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getSdtPrice } from './lib/actions/get-sdt-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const stakeDAO = createPiece({
  displayName: 'StakeDAO',
  description: 'Yield optimization protocol built on top of Curve, Convex, and Pendle. Access TVL data, SDT token price, and protocol analytics.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/stakedao.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.FINANCE],
  actions: [
    getProtocolTvl,
    getSdtPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});

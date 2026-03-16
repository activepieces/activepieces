import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getFraxPrice } from './lib/actions/get-frax-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const fraxtal = createPiece({
  displayName: 'Fraxtal',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/fraxtal.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getFraxPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});

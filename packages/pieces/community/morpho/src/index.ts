import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getMorphoPrice } from './lib/actions/get-morpho-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getLendingStats } from './lib/actions/get-lending-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const morpho = createPiece({
  displayName: 'Morpho',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/morpho.png',
  categories: [PieceCategory.FEATURED, PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getMorphoPrice, getChainBreakdown, getLendingStats, getTvlHistory],
  triggers: [],
});

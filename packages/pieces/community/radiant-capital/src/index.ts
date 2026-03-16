import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getRdntPrice } from './lib/actions/get-rdnt-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getLendingStats } from './lib/actions/get-lending-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const radiantCapital = createPiece({
  displayName: 'Radiant Capital',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/radiant-capital.png',
  categories: [PieceCategory.FEATURED, PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getRdntPrice, getChainBreakdown, getLendingStats, getTvlHistory],
  triggers: [],
});

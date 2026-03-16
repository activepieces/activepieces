import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getSiloPrice } from './actions/get-silo-price';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getLendingStats } from './actions/get-lending-stats';
import { getTvlHistory } from './actions/get-tvl-history';

export const siloFinance = createPiece({
  displayName: 'Silo Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/silo-finance.png',
  categories: [PieceCategory.FEATURED, PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getSiloPrice, getChainBreakdown, getLendingStats, getTvlHistory],
  triggers: [],
});

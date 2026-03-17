import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getOndoPrice } from './actions/get-ondo-price';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getTvlHistory } from './actions/get-tvl-history';
import { getProtocolStats } from './actions/get-protocol-stats';

export const ondoFinance = createPiece({
  displayName: 'Ondo Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://assets.coingecko.com/coins/images/26580/small/ONDO.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getOndoPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});

export default ondoFinance;

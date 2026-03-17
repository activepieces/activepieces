import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getTokenPrice } from './actions/get-token-price';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getTvlHistory } from './actions/get-tvl-history';
import { getProtocolStats } from './actions/get-protocol-stats';

export const helium = createPiece({
  displayName: 'Helium',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/helium.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getTokenPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});

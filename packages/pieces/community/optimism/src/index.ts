import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getOpPrice } from './actions/get-op-price';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getTvlHistory } from './actions/get-tvl-history';
import { getProtocolStats } from './actions/get-protocol-stats';

export const optimism = createPiece({
  displayName: 'Optimism',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/optimism.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getOpPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});

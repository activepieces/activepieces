import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getCpoolPrice } from './lib/actions/get-cpool-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getCreditStats } from './lib/actions/get-credit-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const clearpool = createPiece({
  displayName: 'Clearpool',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/clearpool.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [getProtocolTvl, getCpoolPrice, getChainBreakdown, getCreditStats, getTvlHistory],
  triggers: [],
});

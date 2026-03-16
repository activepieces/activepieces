import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTokePriceAction } from './lib/actions/get-toke-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getPoolStats } from './lib/actions/get-pool-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const tokemak = createPiece({
  displayName: 'Tokemak',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/tokemak.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [getProtocolTvl, getTokePriceAction, getChainBreakdown, getPoolStats, getTvlHistory],
  triggers: [],
});

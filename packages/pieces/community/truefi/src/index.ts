import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTruPrice } from './lib/actions/get-tru-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getLendingStats } from './lib/actions/get-lending-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const truefi = createPiece({
  displayName: 'TrueFi',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/truefi.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [getProtocolTvl, getTruPrice, getChainBreakdown, getLendingStats, getTvlHistory],
  triggers: [],
});

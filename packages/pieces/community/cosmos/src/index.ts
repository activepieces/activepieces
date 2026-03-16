import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './actions/get-protocol-tvl';
import { getAtomPriceAction } from './actions/get-atom-price';
import { getChainBreakdownAction } from './actions/get-chain-breakdown';
import { getTvlHistoryAction } from './actions/get-tvl-history';
import { getProtocolStatsAction } from './actions/get-protocol-stats';

export const cosmos = createPiece({
  displayName: 'Cosmos Hub',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cosmos.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getAtomPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});

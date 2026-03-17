import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getCompPriceAction } from './lib/actions/get-comp-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const compoundFinance = createPiece({
  displayName: 'Compound Finance',
  auth: undefined,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/compound-finance.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description:
    'Compound Finance is the original DeFi lending protocol (2018) and pioneer of liquidity mining. COMP token enables governance. Compound V3 (Comet) offers isolated collateral markets with improved capital efficiency.',
  actions: [
    getProtocolTvlAction,
    getCompPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});

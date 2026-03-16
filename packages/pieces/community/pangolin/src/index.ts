import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getPngPriceAction } from './lib/actions/get-png-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const pangolin = createPiece({
  displayName: 'Pangolin',
  description:
    'Pangolin is a community-driven decentralized exchange (DEX) on Avalanche. It uses an automated market maker (AMM) model similar to Uniswap v2. PNG is the governance and reward token.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pangolin.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getPngPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});

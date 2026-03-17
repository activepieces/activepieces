import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getX2y2PriceAction } from './lib/actions/get-x2y2-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const x2y2 = createPiece({
  displayName: 'X2Y2',
  description:
    'X2Y2 is an Ethereum NFT marketplace offering zero-fee trading, staking rewards for WETH distribution, and collection offers. X2Y2 is the governance token.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/x2y2.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getX2y2PriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});

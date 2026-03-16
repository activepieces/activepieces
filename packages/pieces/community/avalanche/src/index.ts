import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getAvaxPriceAction } from './lib/actions/get-avax-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const avalanche = createPiece({
  displayName: 'Avalanche',
  description:
    'Avalanche is a high-performance Layer-1 blockchain featuring three interoperable chains (X-Chain, C-Chain, P-Chain) and support for custom subnets. AVAX is the native token used for transaction fees, staking, and governance.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/avalanche.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getAvaxPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});

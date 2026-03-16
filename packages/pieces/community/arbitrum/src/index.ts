import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getArbPriceAction } from './lib/actions/get-arb-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const arbitrum = createPiece({
  displayName: 'Arbitrum',
  description:
    'Arbitrum is the leading Ethereum Layer-2 network using optimistic rollups, providing fast and low-cost transactions. ARB is the governance token for Arbitrum One and Arbitrum Nova. Access TVL, ARB token prices, chain breakdowns, and historical data via free public APIs.',
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/arbitrum.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getArbPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});

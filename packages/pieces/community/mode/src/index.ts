import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getModePriceAction } from './lib/actions/get-mode-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const mode = createPiece({
  displayName: 'Mode Network',
  description:
    'Mode Network is an Ethereum Layer-2 built on the OP Stack (Superchain), optimized for DeFi with sequencer fee sharing and referral rewards. Access MODE token prices, protocol TVL, chain breakdowns, and historical DeFi data.',
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mode.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getModePriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getTokenPriceAction } from './lib/actions/get-token-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const nano = createPiece({
  displayName: 'Nano',
  description:
    'Nano (XNO) is a feeless, instant digital currency using a block-lattice data structure. Access real-time TVL, price, and protocol data.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/nano.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getTokenPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});

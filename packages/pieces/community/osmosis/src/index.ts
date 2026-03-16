import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './actions/get-protocol-tvl';
import { getOsmoPriceAction } from './actions/get-osmo-price';
import { getPoolsAction } from './actions/get-pools';
import { getPoolApysAction } from './actions/get-pool-apys';
import { getChainStatsAction } from './actions/get-chain-stats';

export const osmosis = createPiece({
  displayName: 'Osmosis',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/osmosis.png',
  categories: [PieceCategory.FEATURED, PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getOsmoPriceAction,
    getPoolsAction,
    getPoolApysAction,
    getChainStatsAction,
  ],
  triggers: [],
});

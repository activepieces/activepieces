import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getPoolsAction } from './lib/actions/get-pools';
import { getPoolDetailsAction } from './lib/actions/get-pool-details';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';
import { getTokenPoolsAction } from './lib/actions/get-token-pools';
import { getSwapVolumeAction } from './lib/actions/get-swap-volume';

export const balancer = createPiece({
  displayName: 'Balancer',
  description:
    'Interact with Balancer Finance — a programmable AMM protocol on Ethereum and other chains. Query liquidity pools, protocol stats, swap volumes, and more.',
  logoUrl: 'https://cdn.activepieces.com/pieces/balancer.png',
  minimumSupportedRelease: '0.20.0',
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  auth: PieceAuth.None(),
  actions: [
    getPoolsAction,
    getPoolDetailsAction,
    getProtocolStatsAction,
    getTokenPoolsAction,
    getSwapVolumeAction,
  ],
  triggers: [],
});

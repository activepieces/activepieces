import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getVeloPrice } from './actions/get-velo-price';
import { getTopPools } from './actions/get-top-pools';
import { getPoolApys } from './actions/get-pool-apys';
import { getChainStats } from './actions/get-chain-stats';

export const velodrome = createPiece({
  displayName: 'Velodrome Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/velodrome.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getVeloPrice, getTopPools, getPoolApys, getChainStats],
  triggers: [],
});

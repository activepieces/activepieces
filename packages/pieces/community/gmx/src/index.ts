import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolStats } from './actions/get-protocol-stats';
import { getPoolInfo } from './actions/get-pool-info';
import { getTokenPrices } from './actions/get-token-prices';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getVolumeStats } from './actions/get-volume-stats';

export const gmx = createPiece({
  displayName: 'GMX',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/gmx.png',
  authors: ['bossco7598'],
  actions: [getProtocolStats, getPoolInfo, getTokenPrices, getProtocolTvl, getVolumeStats],
  triggers: [],
});

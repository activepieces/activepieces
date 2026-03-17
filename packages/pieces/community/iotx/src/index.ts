import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getIotxPrice } from './lib/actions/get-iotx-price';
import { getNetworkStats } from './lib/actions/get-network-stats';
import { getAccountBalance } from './lib/actions/get-account-balance';
import { getStakingInfo } from './lib/actions/get-staking-info';
import { getDelegateInfo } from './lib/actions/get-delegate-info';

export const iotx = createPiece({
  displayName: 'IoTeX',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl:
    'https://raw.githubusercontent.com/activepieces/activepieces/main/packages/pieces/community/iotx/src/assets/iotx.png',
  authors: ['bossco7598'],
  actions: [
    getIotxPrice,
    getNetworkStats,
    getAccountBalance,
    getStakingInfo,
    getDelegateInfo,
  ],
  triggers: [],
});

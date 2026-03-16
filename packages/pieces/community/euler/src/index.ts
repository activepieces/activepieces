import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getEulerPrice } from './lib/actions/get-euler-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getLendingStats } from './lib/actions/get-lending-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const euler = createPiece({
  displayName: 'Euler Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://raw.githubusercontent.com/activepieces/activepieces/main/packages/pieces/community/euler/src/assets/euler.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getEulerPrice, getChainBreakdown, getLendingStats, getTvlHistory],
  triggers: [],
});

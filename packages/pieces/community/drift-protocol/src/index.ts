import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getMarkets } from './actions/get-markets';
import { getMarketInfo } from './actions/get-market-info';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getDriftStats } from './actions/get-drift-stats';
import { getTopTraders } from './actions/get-top-traders';

export const driftProtocol = createPiece({
  displayName: 'Drift Protocol',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/drift-protocol.png',
  authors: ['bossco7598'],
  categories: ['FEATURED', 'FINANCE'],
  actions: [getMarkets, getMarketInfo, getProtocolTvl, getDriftStats, getTopTraders],
  triggers: [],
});

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getAeroPrice } from './actions/get-aero-price';
import { getTopPools } from './actions/get-top-pools';
import { getPoolApys } from './actions/get-pool-apys';
import { getChainStats } from './actions/get-chain-stats';

export const aerodrome = createPiece({
  displayName: 'Aerodrome Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/aerodrome.png',
  authors: ['bossco7598'],
  categories: ['FEATURED', 'FINANCE'],
  actions: [getProtocolTvl, getAeroPrice, getTopPools, getPoolApys, getChainStats],
  triggers: [],
});

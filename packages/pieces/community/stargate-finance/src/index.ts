import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getStgPrice } from './actions/get-stg-price';
import { getBridgePools } from './actions/get-bridge-pools';
import { getProtocolVolume } from './actions/get-protocol-volume';
import { getChainTvl } from './actions/get-chain-tvl';

export const stargateFinance = createPiece({
  displayName: 'Stargate Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/stargate-finance.png',
  authors: ['bossco7598'],
  categories: ['FEATURED', 'FINANCE'],
  actions: [getProtocolTvl, getStgPrice, getBridgePools, getProtocolVolume, getChainTvl],
  triggers: [],
});

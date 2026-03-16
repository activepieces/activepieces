import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getCakePrice } from './actions/get-cake-price';
import { getTopPools } from './actions/get-top-pools';
import { getPoolApys } from './actions/get-pool-apys';
import { getChainTvl } from './actions/get-chain-tvl';

export const pancakeswap = createPiece({
  displayName: 'PancakeSwap',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pancakeswap.png',
  categories: [PieceCategory.FEATURED, PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getCakePrice, getTopPools, getPoolApys, getChainTvl],
  triggers: [],
});

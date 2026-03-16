import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getFraxPrice } from './actions/get-frax-price';
import { getFrxethStats } from './actions/get-frxeth-stats';
import { getFraxswapPools } from './actions/get-fraxswap-pools';
import { getChainTvl } from './actions/get-chain-tvl';

export const fraxFinance = createPiece({
  displayName: 'Frax Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/frax-finance.png',
  categories: [PieceCategory.FEATURED, PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getFraxPrice, getFrxethStats, getFraxswapPools, getChainTvl],
  triggers: [],
});

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getFluidTvl } from './actions/get-fluid-tvl';
import { getInstPrice } from './actions/get-inst-price';
import { getFluidPools } from './actions/get-fluid-pools';
import { getChainTvl } from './actions/get-chain-tvl';

export const instadapp = createPiece({
  displayName: 'Instadapp',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/instadapp.png',
  categories: [PieceCategory.FEATURED, PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getFluidTvl, getInstPrice, getFluidPools, getChainTvl],
  triggers: [],
});

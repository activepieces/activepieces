import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getDbrPrice } from './actions/get-dbr-price';
import { getBridgeStats } from './actions/get-bridge-stats';
import { getChainTvl } from './actions/get-chain-tvl';
import { getTvlHistory } from './actions/get-tvl-history';

export const debridge = createPiece({
  displayName: 'deBridge',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/debridge.png',
  categories: [PieceCategory.FEATURED, PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getDbrPrice, getBridgeStats, getChainTvl, getTvlHistory],
  triggers: [],
});

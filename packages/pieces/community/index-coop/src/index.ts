import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getIndexPrice } from './lib/actions/get-index-price';
import { getProductPrice } from './lib/actions/get-product-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const indexCoop = createPiece({
  displayName: 'Index Coop',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/index-coop.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getIndexPrice, getProductPrice, getChainBreakdown, getProtocolStats],
  triggers: [],
});

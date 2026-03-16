import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getQuoteAction } from './lib/actions/get-quote';
import { getTokenListAction } from './lib/actions/get-token-list';
import { getPoolDataAction } from './lib/actions/get-pool-data';
import { getTopPoolsAction } from './lib/actions/get-top-pools';
import { getTokenPriceAction } from './lib/actions/get-token-price';

export const uniswap = createPiece({
  displayName: 'Uniswap',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/uniswap.png',
  authors: ['Bossco'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getQuoteAction,
    getTokenListAction,
    getPoolDataAction,
    getTopPoolsAction,
    getTokenPriceAction,
  ],
  triggers: [],
});

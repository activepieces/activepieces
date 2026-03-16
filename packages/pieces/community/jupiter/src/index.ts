import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getQuote } from './lib/actions/get-quote';
import { getPrice } from './lib/actions/get-price';
import { getTokens } from './lib/actions/get-tokens';
import { getTokenPriceHistory } from './lib/actions/get-token-price-history';
import { getStrictTokens } from './lib/actions/get-strict-tokens';

export const jupiter = createPiece({
  displayName: 'Jupiter',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/jupiter.png',
  authors: ['bossco7598'],
  actions: [getQuote, getPrice, getTokens, getTokenPriceHistory, getStrictTokens],
  triggers: [],
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
});

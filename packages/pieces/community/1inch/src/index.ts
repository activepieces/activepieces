import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getQuote } from './lib/actions/get-quote';
import { getSwap } from './lib/actions/get-swap';
import { getTokens } from './lib/actions/get-tokens';
import { getLiquiditySources } from './lib/actions/get-liquidity-sources';
import { getTokenPrice } from './lib/actions/get-token-price';

export const oneInch = createPiece({
  displayName: '1inch',
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Get your free API key at https://portal.1inch.dev/',
    required: true,
  }),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/1inch.png',
  authors: ['Bossco'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [getQuote, getSwap, getTokens, getLiquiditySources, getTokenPrice],
  triggers: [],
});

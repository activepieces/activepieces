import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getSocialVolume } from './lib/actions/get-social-volume';
import { getPriceVolume } from './lib/actions/get-price-volume';
import { getDevActivity } from './lib/actions/get-dev-activity';
import { getExchangeFlows } from './lib/actions/get-exchange-flows';
import { getTrendingWords } from './lib/actions/get-trending-words';
import { santimentAuth } from './lib/common/santiment-auth';

export const santiment = createPiece({
  displayName: 'Santiment',
  auth: santimentAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/santiment.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description: 'On-chain and social analytics for crypto assets via Santiment SanAPI.',
  actions: [
    getSocialVolume,
    getPriceVolume,
    getDevActivity,
    getExchangeFlows,
    getTrendingWords,
  ],
  triggers: [],
});

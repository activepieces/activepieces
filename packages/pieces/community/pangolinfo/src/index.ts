import {
  createPiece,
  PieceCategory,
} from '@activepieces/pieces-framework';
import { askAmazonAlexa } from './lib/actions/ask-amazon-alexa';
import { filterAmazonNiches } from './lib/actions/filter-amazon-niches';
import { getAmazonProduct } from './lib/actions/get-amazon-product';
import { getAmazonReviews } from './lib/actions/get-amazon-reviews';
import { getGoogleAiOverview } from './lib/actions/get-google-ai-overview';
import { searchAmazonProducts } from './lib/actions/search-amazon-products';
import { pangolinfoAuth } from './lib/auth';

const pangolinfo = createPiece({
  displayName: 'Pangolinfo',
  description:
    'Structured Amazon and AI search data for automations and AI agents.',
  auth: pangolinfoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pangolinfo.png',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.PRODUCTIVITY,
  ],
  authors: ['Pangolin-spg'],
  actions: [
    getAmazonProduct,
    searchAmazonProducts,
    getAmazonReviews,
    getGoogleAiOverview,
    filterAmazonNiches,
    askAmazonAlexa,
  ],
  triggers: [],
});

export { pangolinfo };

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { runResearchAction } from './lib/actions/run-research';
import { getResearchStatusAction } from './lib/actions/get-research-status';
import { searchWebAction } from './lib/actions/search-web';
import { extractFromUrlAction } from './lib/actions/extract-from-url';
import { getLinkedinProfileWithEmailAction } from './lib/actions/get-linkedin-profile-with-email';
import { findLinkedinProfileAction } from './lib/actions/find-linkedin-profile';
import { searchLinkedinCompaniesAction } from './lib/actions/search-linkedin-companies';
import { searchLinkedinPeopleAction } from './lib/actions/search-linkedin-people';
import { listCompanyEmployeesAction } from './lib/actions/list-company-employees';
import { findPersonByEmailAction } from './lib/actions/find-person-by-email';
import { verifyEmailAction } from './lib/actions/verify-email';
import { findEmailByNameAction } from './lib/actions/find-email-by-name';
import { findPersonByPhoneAction } from './lib/actions/find-person-by-phone';
import { findPersonByUsPhoneAction } from './lib/actions/find-person-by-us-phone';
import { getCompanyFundingAction } from './lib/actions/get-company-funding';
import { searchAmazonProductsAction } from './lib/actions/search-amazon-products';
import { getAmazonProductAction } from './lib/actions/get-amazon-product';
import { getAmazonBuyBoxOfferAction } from './lib/actions/get-amazon-buy-box-offer';
import { getAmazonSellerAction } from './lib/actions/get-amazon-seller';
import { listAmazonSellerProductsAction } from './lib/actions/list-amazon-seller-products';
import { neuralvergeAuth } from './lib/auth';
import { NEURALVERGE_BASE_URL } from './lib/common/client';

export const neuralverge = createPiece({
  displayName: 'NeuralVerge',
  description:
    'Company and person business intelligence: reverse email and phone lookup, email finder and verification, company funding, LinkedIn and Amazon data, web search, AI extraction and AI research.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/neuralverge.png',
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['neuralverge'],
  auth: neuralvergeAuth,
  actions: [
    runResearchAction,
    getResearchStatusAction,
    searchWebAction,
    extractFromUrlAction,
    getLinkedinProfileWithEmailAction,
    findLinkedinProfileAction,
    searchLinkedinCompaniesAction,
    searchLinkedinPeopleAction,
    listCompanyEmployeesAction,
    findPersonByEmailAction,
    verifyEmailAction,
    findEmailByNameAction,
    findPersonByPhoneAction,
    findPersonByUsPhoneAction,
    getCompanyFundingAction,
    searchAmazonProductsAction,
    getAmazonProductAction,
    getAmazonBuyBoxOfferAction,
    getAmazonSellerAction,
    listAmazonSellerProductsAction,
    createCustomApiCallAction({
      auth: neuralvergeAuth,
      baseUrl: () => NEURALVERGE_BASE_URL,
      authMapping: async (auth) => ({
        'x-api-key': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});

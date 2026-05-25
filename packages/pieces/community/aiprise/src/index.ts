import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

import { runUserVerificationProfileAction } from './lib/actions/run-user-verification-profile';
import { getVerificationUrlAction } from './lib/actions/get-verification-url';
import { getVerificationResultAction } from './lib/actions/get-verification-result';
import { getUserInputDataAction } from './lib/actions/get-user-input-data';
import { updateVerificationResultAction } from './lib/actions/update-verification-result';
import { runBusinessVerificationAction } from './lib/actions/run-business-verification';
import { getBusinessResultAction } from './lib/actions/get-business-result';
import { getBusinessInputDataAction } from './lib/actions/get-business-input-data';
import { runDocumentCheckAction } from './lib/actions/run-document-check';
import { createBusinessProfileAction } from './lib/actions/create-business-profile';
import { createUserProfileAction } from './lib/actions/create-user-profile';
import { getAdditionalUserInfoAction } from './lib/actions/get-additional-user-info';
import { getBusinessDocumentsAction } from './lib/actions/get-business-documents';
import { getUserProfileAction } from './lib/actions/get-user-profile';
import { getBusinessProfileAction } from './lib/actions/get-business-profile';
import { searchBusinessesAction } from './lib/actions/search-businesses';
import { aipriseAuth } from './lib/common/auth';

export const aiprise = createPiece({
  displayName: 'AiPrise',
  description:
    'KYC, KYB, and fraud prevention platform — verify user identities, onboard businesses, run AML/sanctions checks, and detect fraud signals.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/aiprise.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: aipriseAuth,
  authors: ['sanket-a11y'],
  actions: [
    runUserVerificationProfileAction,
    getVerificationUrlAction,
    getVerificationResultAction,
    getUserInputDataAction,
    updateVerificationResultAction,
    runBusinessVerificationAction,
    getBusinessResultAction,
    getBusinessInputDataAction,
    runDocumentCheckAction,
    createBusinessProfileAction,
    createUserProfileAction,
    getUserProfileAction,
    getBusinessProfileAction,
    searchBusinessesAction,
    getAdditionalUserInfoAction,
    getBusinessDocumentsAction,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        auth?.props.environment === 'sandbox'
          ? 'https://api-sandbox.aiprise.com/api/v1'
          : 'https://api.aiprise.com/api/v1',
      auth: aipriseAuth,
      authMapping: async (auth) => ({
        'X-API-KEY': auth.props.secret_text,
      }),
    }),
  ],
  triggers: [],
});

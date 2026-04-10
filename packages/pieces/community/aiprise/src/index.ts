import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

import { runUserVerificationAction } from './lib/actions/run-user-verification';
import { getVerificationUrlAction } from './lib/actions/get-verification-url';
import { getVerificationResultAction } from './lib/actions/get-verification-result';
import { getUserInputDataAction } from './lib/actions/get-user-input-data';
import { updateVerificationResultAction } from './lib/actions/update-verification-result';
import { runBusinessVerificationAction } from './lib/actions/run-business-verification';
import { getBusinessResultAction } from './lib/actions/get-business-result';
import { getBusinessInputDataAction } from './lib/actions/get-business-input-data';
import { runPhoneCheckAction } from './lib/actions/run-phone-check';
import { runEmailCheckAction } from './lib/actions/run-email-check';
import { runUserAmlCheckAction } from './lib/actions/run-user-aml-check';

export const aipriseAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your AiPrise API key:
1. Log in to your [AiPrise dashboard](https://app.aiprise.com)
2. Go to **Settings > API Keys**
3. Copy your API key and paste it here
`,
  required: true,
});

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
    // KYC — User Verification
    runUserVerificationAction,
    getVerificationUrlAction,
    getVerificationResultAction,
    getUserInputDataAction,
    updateVerificationResultAction,
    // KYB — Business Verification
    runBusinessVerificationAction,
    getBusinessResultAction,
    getBusinessInputDataAction,
    // Fraud Checks
    runPhoneCheckAction,
    runEmailCheckAction,
    runUserAmlCheckAction,
    
    // Custom API call for power users
    createCustomApiCallAction({
      baseUrl: () => 'https://api.aiprise.com/api/v1',
      auth: aipriseAuth,
      authMapping: async (auth) => ({
        'X-API-KEY': (auth as { secret_text: string }).secret_text,
      }),
    }),
  ],
  triggers: [

  ],
});

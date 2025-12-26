import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createAccountApplication } from './lib/actions/create-account-application';
import { getAccountApplication } from './lib/actions/get-account-application';
import { updateAccountApplication } from './lib/actions/update-account-application';
import { submitApplication } from './lib/actions/submit-application';
import { runKyc } from './lib/actions/run-kyc';
import { getProducts } from './lib/actions/get-products';
import { getCsrfToken } from './lib/actions/get-csrf-token';

export const narmiAuth = PieceAuth.CustomAuth({
  description: 'Narmi Account Opening API credentials',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the Narmi API (e.g., https://api.sandbox.narmi.dev)',
      required: true,
      defaultValue: 'https://api.sandbox.narmi.dev',
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Narmi API Key (OAuth2 token)',
      required: false,
    }),
  },
});

export const narmi = createPiece({
  displayName: 'Narmi',
  auth: narmiAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://i.imgur.com/EpttLjG.png',
  authors: ['vqnguyen1'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getCsrfToken,
    createAccountApplication,
    getAccountApplication,
    updateAccountApplication,
    submitApplication,
    runKyc,
    getProducts,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as any).baseUrl || 'https://api.sandbox.narmi.dev',
      auth: narmiAuth,
      authMapping: async (auth) => {
        const apiKey = (auth as any).apiKey;
        if (apiKey) {
          return {
            Authorization: `Bearer ${apiKey}`,
          };
        }
        return {};
      },
    }),
  ],
  triggers: [],
});

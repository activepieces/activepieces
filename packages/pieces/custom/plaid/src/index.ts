import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getIdentity } from './lib/actions/get-identity';
import { matchIdentity } from './lib/actions/match-identity';
import { getAuth } from './lib/actions/get-auth';
import { createIdentityVerification } from './lib/actions/create-identity-verification';
import { getIdentityVerification } from './lib/actions/get-identity-verification';

export const plaidAuth = PieceAuth.CustomAuth({
  description: 'Plaid API credentials',
  required: true,
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Plaid API environment',
      required: true,
      options: {
        options: [
          { label: 'Sandbox', value: 'sandbox' },
          { label: 'Development', value: 'development' },
          { label: 'Production', value: 'production' },
        ],
      },
      defaultValue: 'sandbox',
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Your Plaid Client ID',
      required: true,
    }),
    secret: Property.ShortText({
      displayName: 'Secret',
      description: 'Your Plaid Secret',
      required: true,
    }),
  },
});

export const plaid = createPiece({
  displayName: 'Plaid',
  auth: plaidAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://www.logo.wine/a/logo/Plaid_(company)/Plaid_(company)-White-Dark-Background-Logo.wine.svg',
  authors: ['vqnguyen1'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getIdentity,
    matchIdentity,
    getAuth,
    createIdentityVerification,
    getIdentityVerification,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const env = (auth as any).environment || 'sandbox';
        return `https://${env}.plaid.com`;
      },
      auth: plaidAuth,
      authMapping: async (auth) => ({
        'PLAID-CLIENT-ID': (auth as any).clientId,
        'PLAID-SECRET': (auth as any).secret,
      }),
    }),
  ],
  triggers: [],
});

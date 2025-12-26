import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { listLoans } from './lib/actions/list-loans';
import { getLoan } from './lib/actions/get-loan';
import { createLoanBorrower } from './lib/actions/create-loan-borrower';
import { listLoanBorrowers } from './lib/actions/list-loan-borrowers';
import { getLoanBorrower } from './lib/actions/get-loan-borrower';
import { updateLoanBorrower } from './lib/actions/update-loan-borrower';

export const ncinoAuth = PieceAuth.CustomAuth({
  description: 'nCino API credentials (OAuth2)',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the nCino API (e.g., https://api.ncino.com)',
      required: true,
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Your nCino OAuth2 Client ID',
      required: true,
    }),
    clientSecret: Property.ShortText({
      displayName: 'Client Secret',
      description: 'Your nCino OAuth2 Client Secret',
      required: true,
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'OAuth2 access token (if you already have one)',
      required: false,
    }),
  },
});

export const ncino = createPiece({
  displayName: 'nCino',
  auth: ncinoAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://www.ncino.com/assets/global/ncino-logo-dark.svg',
  authors: ['vqnguyen1'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    listLoans,
    getLoan,
    createLoanBorrower,
    listLoanBorrowers,
    getLoanBorrower,
    updateLoanBorrower,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as any).baseUrl || 'https://api.ncino.com',
      auth: ncinoAuth,
      authMapping: async (auth) => {
        const accessToken = (auth as any).accessToken;
        if (accessToken) {
          return {
            Authorization: `Bearer ${accessToken}`,
          };
        }
        return {};
      },
    }),
  ],
  triggers: [],
});

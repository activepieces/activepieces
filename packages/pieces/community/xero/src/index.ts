import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { xeroCreateContact } from './lib/actions/create-contact';
import { xeroCreateInvoice } from './lib/actions/create-invoice';

export const xeroAuth = PieceAuth.OAuth2({
  description: `
  1. Log in to Xero
  2. Go to (Developer portal)[https://developer.xero.com/app/manage/]
  3. Click on the App you want to integrate
  4. On the left, click on \`Configuration\`
  5. Enter your \`redirect url\`
  6. Copy the \`Client Id\` and \`Client Secret\`
  `,
  authUrl: 'https://login.xero.com/identity/connect/authorize',
  tokenUrl: 'https://identity.xero.com/connect/token',
  required: true,
  scope: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'accounting.contacts',
    'accounting.transactions',
  ],
});

export const xero = createPiece({
  displayName: 'Xero',
  description: 'Beautiful accounting software',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/xero.png',
  authors: ['kanarelo', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  categories: [PieceCategory.ACCOUNTING],
  auth: xeroAuth,
  actions: [
    xeroCreateContact,
    xeroCreateInvoice,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.xero.com/api.xro/2.0',
      auth: xeroAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});

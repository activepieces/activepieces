import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { zohoMailActions } from './lib/actions';
import { ZOHO_MAIL_API_URL } from './lib/common';
import { zohoMailTriggers } from './lib/triggers';

export const zohoMailAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
  required: true,
  scope: [
    'ZohoMail.accounts.READ',
    'ZohoMail.messages.ALL',
    'ZohoMail.folders.ALL',
    'ZohoMail.organization.accounts.READ', // Added for fetching accountId if needed by other actions
  ],
  extra: {
    access_type: 'offline',
  },
});

export const zohoMail = createPiece({
  displayName: 'Zoho Mail',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-mail.png', // Placeholder
  auth: zohoMailAuth,
  authors: [],
  actions: [
    ...zohoMailActions,
    createCustomApiCallAction({
      auth: zohoMailAuth,
      baseUrl: () => ZOHO_MAIL_API_URL,
      authMapping: async (auth) => {
        return {
          'Authorization': `Zoho-oauthtoken ${(auth as { access_token: string }).access_token}`,
        };
      },
    })
  ],
  triggers: zohoMailTriggers,
});

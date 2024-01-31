import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const constantContactAuth = PieceAuth.OAuth2({
  required: true,
  tokenUrl: 'https://authz.constantcontact.com/oauth2/default/v1/token',
  authUrl: 'https://authz.constantcontact.com/oauth2/default/v1/authorize',
  scope: ['contact_data'],
});

export const constantContact = createPiece({
  displayName: 'Constant Contact',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/constant-contact.png',
  authors: ['abuaboud'],
  auth: constantContactAuth,
  actions: [
    createOrUpdateContact,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.cc.email/v3', // Replace with the actual base URL
      auth: constantContactAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});

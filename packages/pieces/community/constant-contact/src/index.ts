import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';

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
  categories: [PieceCategory.MARKETING],
  authors: ['abuaboud'],
  auth: constantContactAuth,
  actions: [createOrUpdateContact],
  triggers: [],
});

import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { googleContactsAddContactAction } from './lib/action/create-contact';
import { googleContactNewOrUpdatedContact } from './lib/trigger/new-contact';

export const googleContactsAuth = PieceAuth.OAuth2({
  description: '',

  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: ['https://www.googleapis.com/auth/contacts'],
});

export const googleContacts = createPiece({
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-contacts.png',
  actions: [googleContactsAddContactAction],
  displayName: 'Google Contacts',
  authors: ['abuaboud', 'abdallah-alwarawreh'],
  triggers: [googleContactNewOrUpdatedContact],
  auth: googleContactsAuth,
});

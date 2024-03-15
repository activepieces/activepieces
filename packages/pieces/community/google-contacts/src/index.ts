import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { googleContactsAddContactAction } from './lib/action/create-contact';
import { googleContactsCommon } from './lib/common';
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
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    googleContactsAddContactAction,
    createCustomApiCallAction({
      baseUrl: () => googleContactsCommon.baseUrl,
      auth: googleContactsAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  displayName: 'Google Contacts',
  description: 'Stay connected and organized',

  authors: ["Abdallah-Alwarawreh","Salem-Alaa","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  triggers: [googleContactNewOrUpdatedContact],
  auth: googleContactsAuth,
});

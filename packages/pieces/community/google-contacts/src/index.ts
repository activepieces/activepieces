import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { googleContactsAddContactAction } from './lib/action/create-contact';
import { googleContactsUpdateContactAction } from './lib/action/update-contact';
import { googleContactsSearchContactsAction } from './lib/action/search-contact';
import { googleContactsCommon } from './lib/common';
import { googleContactNewOrUpdatedContact } from './lib/trigger/new-contact';
import { googleContactsAuth } from './lib/auth';

export const googleContacts = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-contacts.png',
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    googleContactsAddContactAction,
    googleContactsUpdateContactAction,
    googleContactsSearchContactsAction,
    createCustomApiCallAction({
      baseUrl: () => googleContactsCommon.baseUrl,
      auth: googleContactsAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth).access_token}`,
      }),
    }),
  ],
  displayName: 'Google Contacts',
  description: 'Stay connected and organized',

  authors: [
    'Abdallah-Alwarawreh',
    'Salem-Alaa',
    'kishanprmr',
    'MoShizzle',
    'khaledmashaly',
    'abuaboud',
    'ikus060',
  ],
  triggers: [googleContactNewOrUpdatedContact],
  auth: googleContactsAuth,
});

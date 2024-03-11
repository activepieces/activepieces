import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact.action';
import { getOrCreateContact } from './lib/actions/create-or-get-contact.action';
import { sendMessage } from './lib/actions/send-message.action';

export const intercomAuth = PieceAuth.OAuth2({
  authUrl: 'https://app.intercom.com/oauth',
  tokenUrl: 'https://api.intercom.io/auth/eagle/token',
  required: true,
  scope: [],
});

export const intercom = createPiece({
  displayName: 'Intercom',
  description: 'Customer messaging platform for sales, marketing, and support',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/intercom.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  auth: intercomAuth,
  triggers: [],
  authors: ["kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  actions: [
    getOrCreateContact,
    createContact,
    sendMessage,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.intercom.io',
      auth: intercomAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
});

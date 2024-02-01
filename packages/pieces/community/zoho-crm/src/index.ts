import {
    OAuth2PropertyValue,
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { newContact } from './lib/triggers/new-contact';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const zohoCrmAuth = PieceAuth.OAuth2({
  props: {
    location: Property.StaticDropdown({
      displayName: 'Location',
      description: 'The location of your Zoho CRM account',
      required: true,
      options: {
        options: [
          {
            label: 'zoho.eu',
            value: 'zoho.eu',
          },
          {
            label: 'zoho.com',
            value: 'zoho.com',
          },
          {
            label: 'zoho.com.au',
            value: 'zoho.com.au',
          },
          {
            label: 'zoho.jp',
            value: 'zoho.jp',
          },
        ],
      },
    }),
  },
  description: 'Authentication for Zoho CRM',
  scope: ['ZohoCRM.modules.READ'],
  authUrl: 'https://accounts.{location}/oauth/v2/auth',
  tokenUrl: 'https://accounts.{location}/oauth/v2/token',
  required: true,
});

export const zohoCrm = createPiece({
  displayName: 'Zoho CRM',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-crm.png',
  minimumSupportedRelease: '0.5.0',
  authors: ['abuaboud'],
  auth: zohoCrmAuth,
  actions: [
    createCustomApiCallAction({
      baseUrl: (auth) => `https://${(auth as OAuth2PropertyValue).data.location}/crm/v4`,
      auth: zohoCrmAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newContact],
});

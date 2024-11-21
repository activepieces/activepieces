import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { newContact } from './lib/triggers/new-contact';
import { readFile } from './lib/actions/read-file';

export const zohoCrmAuth = PieceAuth.OAuth2({
  props: {
    location: Property.StaticDropdown({
      displayName: 'Location',
      description: 'The location of your Zoho CRM account',
      required: true,
      options: {
        options: [
          {
            label: 'zoho.eu (Europe)',
            value: 'zoho.eu',
          },
          {
            label: 'zoho.com (United States)',
            value: 'zoho.com',
          },
          {
            label: 'zoho.com.au (Australia)',
            value: 'zoho.com.au',
          },
          {
            label: 'zoho.jp (Japan)',
            value: 'zoho.jp',
          },
          {
            label: 'zoho.in (India)',
            value: 'zoho.in',
          },
          {
            label: 'zohocloud.ca (Canada)',
            value: 'zohocloud.ca',
          },
        ],
      },
    }),
  },
  description: 'Authentication for Zoho CRM',
  scope: ['ZohoCRM.users.ALL','ZohoCRM.org.ALL', 'ZohoCRM.settings.ALL', 'ZohoCRM.modules.ALL', 'ZohoCRM.bulk.ALL', 'ZohoCRM.bulk.backup.ALL', 'ZohoFiles.files.ALL'],
  authUrl: 'https://accounts.{location}/oauth/v2/auth',
  tokenUrl: 'https://accounts.{location}/oauth/v2/token',
  required: true,
});

export const zohoCrm = createPiece({
  displayName: 'Zoho CRM',
  description: 'Customer relationship management software',

  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-crm.png',
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud","ikus060"],
  auth: zohoCrmAuth,
  actions: [
    readFile,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        {
          const data = (auth as OAuth2PropertyValue).data;
          return data && data['api_domain']? `${data['api_domain']}/crm/v3` : ''
        },    
      
      auth: zohoCrmAuth,
      authMapping: async (auth) => ({
        Authorization: `Zoho-oauthtoken ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newContact],
});

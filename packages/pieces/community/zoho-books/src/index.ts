import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

export const zohoBooksAuth = PieceAuth.OAuth2({
  props: {
    location: Property.StaticDropdown({
      displayName: 'Location',
      description: 'The location of your Zoho Books account',
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
  description: 'Authentication for Zoho Books',
  scope: ['ZohoBooks.fullaccess.all'],
  authUrl: 'https://accounts.{location}/oauth/v2/auth',
  tokenUrl: 'https://accounts.{location}/oauth/v2/token',
  required: true,
});

export const zohoBooks = createPiece({
  displayName: "Zoho Books",
  description: 'Comprehensive online accounting software for small businesses.',
  logoUrl: "https://cdn.activepieces.com/pieces/zoho-books.png",
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.ACCOUNTING],
  authors: ["ikus060"],
  auth: zohoBooksAuth,
  actions: [
    createCustomApiCallAction({
      baseUrl: (auth) =>
      {
        const data = (auth as OAuth2PropertyValue).data;
        return data && data['api_domain']? `${data['api_domain']}/books/v3` : ''
      },        
      auth: zohoBooksAuth,
      authMapping: async (auth) => ({
        Authorization: `Zoho-oauthtoken ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
    
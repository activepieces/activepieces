import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const biginZohoAuth = PieceAuth.OAuth2({
  props: {
    location: Property.StaticDropdown({
      displayName: 'Location',
      description: 'The location of your Bigin account',
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
  description: 'Authentication for Bigin by Zoho',
  scope: [
    'ZohoBigin.modules.ALL',
    'ZohoBigin.users.ALL',
    'ZohoBigin.org.ALL',
    'ZohoBigin.settings.ALL',
  ],
  authUrl: 'https://accounts.{location}/oauth/v2/auth',
  tokenUrl: 'https://accounts.{location}/oauth/v2/token',
  required: true,
});

export type BiginZohoAuthType = {
  access_token: string;
  location: string;
}; 
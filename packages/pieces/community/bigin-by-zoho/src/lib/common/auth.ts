import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginApiCall } from './client';

export const biginAuth = PieceAuth.OAuth2({
  description: 'Authenticate with Bigin by Zoho',
  authUrl: 'https://accounts.zoho.{domain}/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.{domain}/oauth/v2/token',
  required: true,
  scope: [
    'ZohoBigin.modules.ALL',
    'ZohoBigin.settings.ALL',
    'ZohoBigin.users.READ',
    'ZohoBigin.org.READ'
  ],
  props: {
    domain: Property.StaticDropdown({
      displayName: 'Domain',
      description: 'Select your Zoho domain based on your location',
      required: true,
      options: {
        options: [
          { label: 'United States (.com)', value: 'com' },
          { label: 'Europe (.eu)', value: 'eu' },
          { label: 'India (.in)', value: 'in' },
          { label: 'Australia (.com.au)', value: 'com.au' },
          { label: 'Japan (.jp)', value: 'jp' },
          { label: 'China (.com.cn)', value: 'com.cn' },
          { label: 'Saudi Arabia (.sa)', value: 'sa' },
          { label: 'Canada (.ca)', value: 'ca' }
        ]
      },
      defaultValue: 'com'
    })
  },
  validate: async ({ auth }) => {
    try {
      await biginApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: '/settings/modules'
      });
      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid authentication credentials or insufficient permissions'
      };
    }
  }
});

import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { biginApiService } from './common/request';
import { DATA_CENTER_REGIONS } from './common/constants';
import { getZohoBiginAccountAuthorizationUrl } from './common/helpers';

export const biginAuth = PieceAuth.OAuth2({
  authUrl: '{domain}/oauth/v2/auth',
  tokenUrl: '{domain}/oauth/v2/token',
  required: true,
  scope: [
    'ZohoBigin.modules.ALL',
    'ZohoBigin.settings.ALL',
    'ZohoBigin.users.ALL',
    'ZohoBigin.notifications.ALL',
    'ZohoSearch.securesearch.READ',
  ],
  props: {
    domain: Property.StaticDropdown({
      displayName: 'Your Data Center Region',
      description: 'Select your Zoho data center region for your account',
      required: true,
      options: {
        options: DATA_CENTER_REGIONS.map((region) => ({
          label: region.LABEL,
          value: getZohoBiginAccountAuthorizationUrl(region.REGION),
        })),
      },
      defaultValue: getZohoBiginAccountAuthorizationUrl(
        DATA_CENTER_REGIONS[0].REGION
      ),
    }),
  },
  validate: async ({ auth }) => {
    const { domain } = auth.props as any;
    if (!domain) {
      return {
        valid: false,
        error: 'Please select your data center region.',
      };
    }

    try {
      const region = DATA_CENTER_REGIONS.find(
        (r) => r.ACCOUNTS_DOMAIN === domain || getZohoBiginAccountAuthorizationUrl(r.REGION) === domain
      );
      const apiDomain = region?.API_DOMAIN ?? 'https://www.zohoapis.com';
      await biginApiService.fetchModules(auth.access_token, apiDomain);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not validate OAuth credentials. please check your Client ID, Secret, and Region.',
      };
    }
  },
});

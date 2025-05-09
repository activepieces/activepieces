import { OAuth2PropertyValue, PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

// Define constants for API URLs
const QUICKBOOKS_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QUICKBOOKS_TOKEN_URL_SANDBOX = 'https://sandbox-oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QUICKBOOKS_TOKEN_URL_PRODUCTION = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QUICKBOOKS_API_URL_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
const QUICKBOOKS_API_URL_PRODUCTION = 'https://quickbooks.api.intuit.com/v3/company';

// Define the auth type - we'll use OAuth2PropertyValue directly
export type QuickbooksAuthType = OAuth2PropertyValue;

export const quickbooksAuth = PieceAuth.OAuth2({
  description: 'OAuth2 authentication for QuickBooks. You can find your Realm ID in the QuickBooks Developer Dashboard.',
  authUrl: QUICKBOOKS_AUTH_URL,
  tokenUrl: '{{(connections.environment == "sandbox") ? "' + QUICKBOOKS_TOKEN_URL_SANDBOX + '" : "' + QUICKBOOKS_TOKEN_URL_PRODUCTION + '"}}',
  required: true,
  scope: [
    'com.intuit.quickbooks.accounting',
    'openid',
    'profile',
    'email',
    'phone',
    'address'
  ],
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Choose between sandbox (testing) and production environments',
      required: true,
      options: {
        options: [
          { label: 'Sandbox', value: 'sandbox' },
          { label: 'Production', value: 'production' }
        ]
      },
      defaultValue: 'production'
    }),
    realmId: Property.ShortText({
      displayName: 'Company ID (Realm ID)',
      description: 'The QuickBooks Company ID (also known as Realm ID). You can find this in the QuickBooks Developer Dashboard.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { access_token, props } = auth as OAuth2PropertyValue;

      if (!props || !props['environment'] || !props['realmId']) {
        return {
          valid: false,
          error: 'Missing required properties: environment or realmId',
        };
      }

      // Determine the API URL based on the environment
      const apiBaseUrl = props['environment'] === 'sandbox'
        ? QUICKBOOKS_API_URL_SANDBOX
        : QUICKBOOKS_API_URL_PRODUCTION;

      // Test the connection by fetching company info
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${apiBaseUrl}/${props['realmId']}/companyinfo/${props['realmId']}`,
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json',
        },
        queryParams: {
          minorversion: '65'  // Using a stable API version
        }
      });

      if (response.status === 200) {
        return {
          valid: true,
        };
      }

      return {
        valid: false,
        error: `Unable to connect to QuickBooks: ${response.status} ${JSON.stringify(response.body)}`,
      };
    } catch (error) {
      console.error('QuickBooks authentication validation error:', error);
      return {
        valid: false,
        error: `Unable to connect to QuickBooks: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

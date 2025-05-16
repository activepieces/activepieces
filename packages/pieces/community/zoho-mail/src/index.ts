import { PieceAuth, Property, createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { zohoMailActions } from './lib/actions';
import { zohoMailTriggers } from './lib/triggers';
import { getZohoMailApiUrl } from './lib/common';
import { PieceCategory } from '@activepieces/shared';

const zohoDataCenterDomains = {
  US: 'com',
  EU: 'eu',
  IN: 'in',
  AU: 'com.au',
  JP: 'jp',
  CN: 'com.cn', // Note: China region often has special considerations
  CA: 'ca',
};

// This type alias can represent the keys for user-friendly labels
type ZohoDataCenterKey = keyof typeof zohoDataCenterDomains;
// The actual prop value will be the domain string like 'com', 'eu'

export const zohoMailAuth = PieceAuth.OAuth2({
  description: 'Zoho Mail Connection. Select your account data center.',
  props: {
    data_center: Property.StaticDropdown<string, true>({
      displayName: 'Data Center',
      required: true,
      options: {
        disabled: false,
        options: Object.entries(zohoDataCenterDomains).map(([key, domain]) => ({
          label: key as ZohoDataCenterKey, // e.g., US, EU
          value: domain,                 // e.g., com, eu
        })),
      },
      defaultValue: zohoDataCenterDomains.US, // Default to 'com'
    }),
  },
  authUrl: 'https://accounts.zoho.{data_center}/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.{data_center}/oauth/v2/token',
  required: true,
  scope: [
    'ZohoMail.accounts.READ',
    'ZohoMail.messages.ALL',
    'ZohoMail.folders.ALL',
    'ZohoMail.organization.accounts.READ',
  ],
  extra: {
    access_type: 'offline',
  },
});

// Define an interface for auth properties that includes data_center
interface ZohoAuthProps extends OAuth2PropertyValue {
  data_center: string; // This will hold the domain suffix, e.g., 'com', 'eu'
}

export const zohoMail = createPiece({
  displayName: 'Zoho Mail',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-mail.png',
  auth: zohoMailAuth,
  authors: ['onyedikachi-david'],
  description: 'Zoho Mail is a powerful email service that allows you to manage your email, contacts, and calendars efficiently.',
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    ...zohoMailActions,
    createCustomApiCallAction({
      auth: zohoMailAuth,
      baseUrl: (auth) => {
        const authProps = auth as ZohoAuthProps;
        const selectedKey = (Object.keys(zohoDataCenterDomains) as ZohoDataCenterKey[]).find(
          key => zohoDataCenterDomains[key] === authProps.data_center
        );
        return getZohoMailApiUrl(selectedKey || 'US'); // Default to 'US' key if lookup fails
      },
      authMapping: async (auth) => {
        return {
          'Authorization': `Zoho-oauthtoken ${(auth as { access_token: string }).access_token}`,
        };
      },
    })
  ],
  triggers: zohoMailTriggers,
});

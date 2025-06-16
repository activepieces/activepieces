import {
  createPiece,
  PieceAuth,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction, HttpMethod } from '@activepieces/pieces-common';
import { smartsheetApiCall } from './lib/common/client';

const markdownDescription = `
To use the Smartsheet API, you need to generate an API access token.

To generate an API key:

1. On the left Navigation Bar, select More than Account.
2. Select Apps & Integrations.
3. Navigate to the **API Access** tab.
4. Select **Generate new access token**.
5. Copy and store this key somewhere safe. For security reasons, it won't be visible again in your account settings.

You can also revoke existing tokens in this tab.
`;

export const smartsheetAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Token',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      required: true,
      options: {
        options: [
          { label: 'Default (smartsheet.com)', value: 'default' },
          { label: 'Gov (smartsheetgov.com)', value: 'gov' },
          { label: 'Europe (smartsheet.eu)', value: 'eu' },
          { label: 'Australia (smartsheet.au)', value: 'au' },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    try {
      await smartsheetApiCall({
        apiKey: auth.apiKey as string,
        method: HttpMethod.GET,
        resourceUri: '/users/me',
        region: auth.region as 'default' | 'gov' | 'eu' | 'au',
      });

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key or Region.',
      };
    }
  },
  required: true
});

export const smartsheet = createPiece({
  displayName: 'Smartsheet',
  auth: smartsheetAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/smartsheet.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['krushnarout'],
  actions: [
    createCustomApiCallAction({
      auth: smartsheetAuth,
      baseUrl: (auth) => {
        const authValue = auth as PiecePropValueSchema<typeof smartsheetAuth>;
        switch (authValue.region) {
          case 'gov':
            return 'https://api.smartsheetgov.com/2.0';
          case 'eu':
            return 'https://api.smartsheet.eu/2.0';
          case 'au':
            return 'https://api.smartsheet.au/2.0';
          default:
            return 'https://api.smartsheet.com/2.0';
        }
      },
      authMapping: async (auth) => {
        const authValue = auth as PiecePropValueSchema<typeof smartsheetAuth>;
        return {
          Authorization: `Bearer ${authValue.apiKey}`,
        };
      },
    }),
  ],
  triggers: [],
});

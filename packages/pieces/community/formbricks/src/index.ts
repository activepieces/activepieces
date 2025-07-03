import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { triggers } from './lib/triggers';

const markdownPropertyDescription = `
  **Enable Basic Authentication:**
  1. Login to your Formbricks account
  2. On the top-right, click on your account dropdown
  3. Select 'Product Settings'
  4. On the left, select 'API Keys'
  5. Click on 'Add Production API Key'
  6. On the popup form, enter the 'API Key Label' to name the Key
  7. Copy the API key and paste it below.

  **APP URL:**
  - The API URL for Formbricks example the cloud is at https://app.formbricks.com
  - **Note: make sure there is no trailing slash and no /api**
`;

export type FormBricksAuthType = {
  appUrl: string;
  apiKey: string;
};

export const formBricksAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdownPropertyDescription,
  props: {
    appUrl: Property.ShortText({
      displayName: 'APP URL',
      required: true,
      defaultValue: 'https://app.formbricks.com',
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const authValue = auth as PiecePropValueSchema<typeof formBricksAuth>;

      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${authValue.appUrl}/api/v1/management/me`,
        headers: {
          'x-api-key': authValue.apiKey,
        },
      });
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Please provide correct APP URL and API key.',
      };
    }
  },
});

export const formbricks = createPiece({
  displayName: 'Formbricks',
  description: 'Open source Survey Platform',
  auth: formBricksAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/formbricks.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['kanarelo', 'kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [
    createCustomApiCallAction({
      auth: formBricksAuth,
      authMapping: async (auth) => {
        return {
          'x-api-key': (auth as FormBricksAuthType).apiKey,
        };
      },
      baseUrl: (auth) => `${(auth as FormBricksAuthType).appUrl}/api/v1`,
    }),
  ],
  triggers,
});

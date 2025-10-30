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
  1. Login to your SurveyTale account
  2. On the top-right, click on your account dropdown
  3. Select 'Product Settings'
  4. On the left, select 'API Keys'
  5. Click on 'Add Production API Key'
  6. On the popup form, enter the 'API Key Label' to name the Key
  7. Copy the API key and paste it below.

  **APP URL:**
  - The API URL for SurveyTale example the cloud is at https://app.surveytale.com
  - **Note: make sure there is no trailing slash and no /api**
`;

export type SurveyTaleAuthType = {
  appUrl: string;
  apiKey: string;
};

export const surveyTaleAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdownPropertyDescription,
  props: {
    appUrl: Property.ShortText({
      displayName: 'APP URL',
      required: true,
      defaultValue: 'https://app.surveytale.com',
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const authValue = auth as PiecePropValueSchema<typeof surveyTaleAuth>;
      console.log('[SurveyTale] Starting validation...', { url: authValue.appUrl });

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${authValue.appUrl}/api/v1/management/me`,
        headers: {
          'x-api-key': authValue.apiKey,
        },
        timeout: 10000, // 10 second timeout
      });

      console.log('[SurveyTale] Validation successful!', { status: response.status });
      return {
        valid: true,
      };
    } catch (error) {
      console.error('[SurveyTale] Validation failed:', error);
      return {
        valid: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Please check your APP URL and API key'}`,
      };
    }
  },
});

export const surveytale = createPiece({
  displayName: 'SurveyTale',
  description: 'Experience management platform for surveys and feedback',
  auth: surveyTaleAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/surveytale.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['SurveyTale'],
  actions: [
    createCustomApiCallAction({
      auth: surveyTaleAuth,
      authMapping: async (auth) => {
        return {
          'x-api-key': (auth as SurveyTaleAuthType).apiKey,
        };
      },
      baseUrl: (auth) => `${(auth as SurveyTaleAuthType).appUrl}/api/v1`,
    }),
  ],
  triggers,
});

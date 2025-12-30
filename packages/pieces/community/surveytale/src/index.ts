import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { triggers } from './lib/triggers';

export const SURVEYTALE_BASE_URL = 'https://app.surveytale.com';

const markdownPropertyDescription = `
  **How to get your API Key:**
  1. Login to your SurveyTale account
  2. On the bottom-left, click on your account dropdown
  3. Select 'Organization' from the popup menu
  4. Select the 'API Keys' tab
  5. Click on 'Add API Key'
  6. On the popup form, enter the 'API Key Label' and under Project Access click "Add Permission", select the desired project and assign "Read" permission
  7. Copy the API key and paste it below.
`;

export const surveyTaleAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdownPropertyDescription,
  validate: async ({ auth }) => {
    try {
      const apiKey = auth as string;

      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SURVEYTALE_BASE_URL}/api/v1/management/me`,
        headers: {
          'x-api-key': apiKey,
        },
        timeout: 10000,
      });

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Please check your API key'}`,
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
          'x-api-key': auth as string,
        };
      },
      baseUrl: () => `${SURVEYTALE_BASE_URL}/api/v1`,
    }),
  ],
  triggers,
});

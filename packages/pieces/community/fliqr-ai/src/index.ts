import { HttpMethod, createCustomApiCallAction, httpClient } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { getFliqrAccountDetails } from './lib/actions/get-account-details';
import { fliqrConfig } from './lib/common/models';
import { getFliqrAccountFlows } from './lib/actions/get-account-flows';
import { PieceCategory } from '@activepieces/shared';

export const fliqrAuth = PieceAuth.SecretText({
  displayName: 'Fliqr API Access Token',
  required: true,
  description: `
      To obtain your Fliqr API access token, follow these steps:

      1. Log in to your Fliqr account.
      2. Navigate to Fliqr API Access Token Settings.
      3. Under the Integrations section, find the Fliqr API Access Token.
      4. Click on Copy Token to copy your existing token or click on Generate Token to create a new one.
      5. Copy the token and paste it below in "Fliqr API Access Token".
    `,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: `${fliqrConfig.baseUrl}/accounts/me`,
      headers: {
        [fliqrConfig.accessTokenHeaderKey]: auth.auth,
        },
    });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid personal access token',
      };
    }
  },
});

export const fliqrAi = createPiece({
  displayName: 'Fliqr AI',
  description:
    'Omnichannel AI chatbot enhancing customer interactions across WhatsApp, Facebook, Instagram, Telegram, and 6 other platforms.',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/fliqr-ai.png',
  authors: ["drona2938"],
  categories: [PieceCategory.COMMUNICATION,PieceCategory.CUSTOMER_SUPPORT,PieceCategory.MARKETING],
  auth: fliqrAuth,
  actions: [ getFliqrAccountDetails, 
    getFliqrAccountFlows,
    createCustomApiCallAction({
      baseUrl: () => fliqrConfig.baseUrl,
      auth: fliqrAuth,
      authMapping: async (auth) => ({
        [fliqrConfig.accessTokenHeaderKey]: `${auth}`,
      }),
    }),
  ],
  triggers: [],
});

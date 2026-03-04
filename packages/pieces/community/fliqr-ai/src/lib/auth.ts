import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fliqrConfig } from './common/models';

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

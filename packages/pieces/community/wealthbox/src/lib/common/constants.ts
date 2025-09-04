import { PieceAuth } from '@activepieces/pieces-framework';
import { wealthboxApiService } from './requests';

export const BASE_URL = 'https://api.crmworkspace.com/v1';

export const API_ENDPOINTS ={
    ME: '/me',
    TASKS: '/tasks'
}

export const wealthBoxAuth = PieceAuth.SecretText({
  displayName: 'Personal API Access Token',
  description:
    'In order to obtain a new access token or to manage your existing tokens, please visit the API access token settings page.',
  required: true,
  validate: async ({ auth }) => {
    try {
        await wealthboxApiService
          .fetchCurrentlyLoggedInUser(auth)
          .catch((err) => {
            throw new Error(
              'something went wrong. Please check your username and API key and try again.'
            );
          });

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Connection failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  },
});

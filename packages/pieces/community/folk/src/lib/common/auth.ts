import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.folk.app/v1';

export const folkAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To obtain your Folk API key:
1. Sign in to your Folk account
2. Go to your workspace settings
3. Navigate to the "API" section
4. Generate or copy your API key

Your API key will be used to authenticate all requests to Folk's API.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      // Test the API key by making a request to the users endpoint
      // This is a simple endpoint that should work with valid authentication
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/users`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
      });

      return {
        valid: true,
        message: 'API key validated successfully. Connected to Folk.'
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your Folk API key and try again.',
        };
      }
      if (error.response?.status === 403) {
        return {
          valid: false,
          error: 'Access forbidden. Please verify your API key has the necessary permissions.',
        };
      }
      if (error.response?.status === 429) {
        return {
          valid: false,
          error: 'Rate limit exceeded. Please wait and try again.',
        };
      }
      if (error.message?.toLowerCase().includes('network')) {
        return {
          valid: false,
          error: 'Network error. Please check your internet connection and try again.',
        };
      }
      return {
        valid: false,
        error: `Authentication failed: ${error.message}. Please verify your API key is correct.`,
      };
    }
  },
});


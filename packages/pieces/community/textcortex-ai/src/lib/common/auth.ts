import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const textcortexAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your TextCortex API key:
1. Sign up for free at https://textcortex.com
2. Go to your account settings
3. Navigate to the API Key section
4. Generate and copy your API key

Your API key should start with 'gAAAAAB...'`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.textcortex.com/v1/texts/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        body: {
          text: 'test',
          max_tokens: 1,
        },
      });
      return { valid: true };
    } catch (e: any) {
      if (e.response?.status === 401) {
        return { 
          valid: false, 
          error: 'Invalid API key. Please check your TextCortex API key and try again.' 
        };
      }
      if (e.response?.status === 429) {
        return { 
          valid: false, 
          error: 'Rate limit exceeded. Please wait and try again or upgrade your TextCortex plan.' 
        };
      }
      if (e.response?.status === 400) {
        return { valid: true };
      }
      if (e.message?.toLowerCase().includes('network')) {
        return { 
          valid: false, 
          error: 'Network error. Please check your internet connection and try again.' 
        };
      }
      return { 
        valid: false, 
        error: 'Authentication failed. Please verify your API key is correct.' 
      };
    }
  },
});

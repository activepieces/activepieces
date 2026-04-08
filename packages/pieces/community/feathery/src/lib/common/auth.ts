import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { featheryCommon } from './client';

export const featheryAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Feathery admin API key. You can get an API key by creating an account.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await featheryCommon.apiCall({
        method: HttpMethod.GET,
        url: '/account/',
        apiKey: auth,
      });
      
      return {
        valid: true,
        message: 'API key validated successfully. Connected to Feathery.'
      };
    } catch (error: any) {
      if (error.message.includes('401') || error.message.includes('403')) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your API key and try again.',
        };
      }
      
      return {
        valid: false,
        error: `Authentication failed: ${error.message}. Please verify your API key is correct.`,
      };
    }
  },
});



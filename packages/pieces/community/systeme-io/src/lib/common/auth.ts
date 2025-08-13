import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoCommon } from './client';

export const systemeIoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Systeme.io API key. You can find this in your Systeme.io dashboard under Profile Settings > Public API Keys.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await systemeIoCommon.apiCall({
        method: HttpMethod.GET,
        url: '/tags',
        auth: { apiKey: auth as string },
      });
      
      return {
        valid: true,
        message: 'API key validated successfully. Connected to Systeme.io.'
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

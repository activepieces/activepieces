import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon } from './client'

export const paperformAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Paperform API key. You can find this in your Paperform dashboard under Settings > Developer.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await paperformCommon.apiCall({
        method: HttpMethod.GET,
        url: '/forms',
        auth: { apiKey: auth as string },
      });
      
      return {
        valid: true,
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

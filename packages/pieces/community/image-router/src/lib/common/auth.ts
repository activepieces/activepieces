import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { imageRouterApiCall } from './client';

export const imageRouterAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your ImageRouter API key. You can get your API key from the [ImageRouter API Keys page](https://imagerouter.io/api-keys).',
  required: true,
  validate: async ({ auth }) => {
    try {
      await imageRouterApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/v1/openai/images/generations',
        body: {
          prompt: 'test',
          model: 'test/test',
        },
      });
      
      return {
        valid: true,
        message: 'API key validated successfully. Connected to ImageRouter.',
      };
    } catch (error: any) {
      if (error.message.includes('401') || error.message.includes('403')) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your API key and try again.',
        };
      }
      
      if (error.message.includes('429')) {
        return {
          valid: false,
          error: 'Rate limit exceeded. Please wait a moment and try again.',
        };
      }
      
      return {
        valid: false,
        error: `Authentication failed: ${error.message}. Please verify your API key is correct.`,
      };
    }
  },
});


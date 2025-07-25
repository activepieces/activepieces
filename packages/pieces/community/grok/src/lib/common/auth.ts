import { PieceAuth } from '@activepieces/pieces-framework';
import { grokApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const grokAuth = PieceAuth.CustomAuth({
  description: 'Enter your Grok API Key.',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your API key from the xAI console.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await grokApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/models',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
  required: true,
});

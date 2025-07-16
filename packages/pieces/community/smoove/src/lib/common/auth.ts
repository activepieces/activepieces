import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smooveApiCall } from './client';

export const smooveAuth = PieceAuth.CustomAuth({
  description: 'Enter your Smoove API Key',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    try {
      await smooveApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/lists',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key. Please check your credentials.',
      };
    }
  },
});

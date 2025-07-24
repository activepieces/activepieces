import { PieceAuth } from '@activepieces/pieces-framework';
import { hunterIoApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const hunterIoAuth = PieceAuth.CustomAuth({
  description: 'Enter your Hunter.io API Key. You can find your key in your dashboard: https://hunter.io/dashboard/api',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await hunterIoApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/account',
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

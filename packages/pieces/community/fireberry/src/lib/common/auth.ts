import { PieceAuth } from '@activepieces/pieces-framework';
import { fireberryApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const fireberryAuth = PieceAuth.CustomAuth({
  description: 'Enter your Fireberry API Key',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await fireberryApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/users/me',
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API Key' };
    }
  },
  required: true,
});

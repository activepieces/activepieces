import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const aircallAuth = PieceAuth.BasicAuth({
  description: `You can create API key by naviagting to **Integrations & API** menu.`,
  required: true,
  username: {
    displayName: 'API ID',
  },
  password: {
    displayName: 'API Token',
  },
  validate: async ({ auth }) => {
    try {
      await makeRequest(auth, HttpMethod.GET, '/ping');

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid Credentials' };
    }
  },
});

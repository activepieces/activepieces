import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

import { makeRequest } from './common';

export const greenhouseAuth = PieceAuth.BasicAuth({
  description:
    'Navigate to **Admin → Settings → API Credential Management** to create your Greenhouse Harvest API key.',
  required: true,
  username: {
    displayName: 'API Key',
    description: 'Your Greenhouse Harvest API key.',
  },
  password: {
    displayName: 'Password',
    description: 'Leave blank — Greenhouse uses the API key as the username and an empty password.',
  },
  validate: async ({ auth }) => {
    try {
      await makeRequest(auth, {
        method: HttpMethod.GET,
        path: '/users',
        queryParams: {
          per_page: '1',
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid Greenhouse Harvest API credentials.',
      };
    }
  },
});

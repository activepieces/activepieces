import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const aircallAuth = PieceAuth.BasicAuth({
  description:
    'Authenticate using your Aircall API credentials (API ID and API Token from Company Settings > API Keys)',
  required: true,
  username: {
    displayName: 'API ID',
    description: 'Your Aircall API ID from Company Settings > API Keys',
  },
  password: {
    displayName: 'API Token',
    description: 'Your Aircall API Token from Company Settings > API Keys',
  },
  validate: async ({ auth }) => {
    try {
      await makeRequest(auth, HttpMethod.GET, '/ping',);

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Failed to connect to Aircall API' };
    }
  },
});

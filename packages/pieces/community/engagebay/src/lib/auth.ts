import { PieceAuth } from '@activepieces/pieces-framework';
import { engagebayRequest } from './common/client';

export const engagebayAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your EngageBay REST API key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await engagebayRequest({
        apiKey: auth,
        path: '/api/core/groups',
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or unable to reach the EngageBay API.',
      };
    }
  },
});

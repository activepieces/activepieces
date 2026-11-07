import { PieceAuth } from '@activepieces/pieces-framework';
import { privatusApiCall, PrivatusApiError } from './common/client';

export const privatusAnalyticsAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `To get your API token:
1. Log in to [Privatus Analytics](https://privatusanalytics.com).
2. Open **Workspace settings**, then **API tokens**.
3. Click **Create token**. The triggers and actions only read numbers, so read access to analytics is enough. (Custom API Call can do more if the token allows it.)
4. Copy the token (it starts with \`pat_\`) and paste it here. It is shown only once.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await privatusApiCall({ token: auth, path: '/workspaces.json' });
      return { valid: true };
    } catch (error) {
      if (error instanceof PrivatusApiError && error.status === 401) {
        return {
          valid: false,
          error: 'That API token is invalid, revoked or expired.',
        };
      }
      return {
        valid: false,
        error: 'Could not check the API token. Please try again.',
      };
    }
  },
});

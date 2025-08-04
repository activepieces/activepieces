import { PieceAuth } from '@activepieces/pieces-framework';
import { respondIoApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

// For typing purposes in the client
export const RespondIoAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Your Respond.io API v2 Token.',
  required: true,
});

export const respondIoAuth = PieceAuth.CustomAuth({
  description: `
  Please follow these steps to get your Respond.io API token:
  
  1. Log in to your Respond.io account.
  2. In the left sidebar, navigate to Settings.
  3. Under Workspace Settings, click on Integrations.
  4. Locate and click on the Developer API option.
  5. Within the Developer API section, find your API key or generate a new one if needed.`,
  props: {
    token: RespondIoAuth,
  },
  validate: async ({ auth }) => {
    try {
      // This endpoint lists space users, a simple way to validate the token.
      await respondIoApiCall({
        method: HttpMethod.GET,
        url: '/space/user',
        auth: auth,
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Token',
      };
    }
  },
  required: true,
});

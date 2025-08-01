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
  Please visit your Respond.io settings to get your API token.
  
  1. Go to your **Settings** module.
  2. Click on **User Settings**.
  3. Go to the **API Token** tab.
  4. Click **Generate Token** and copy the v2 token.`,
  props: {
    token: RespondIoAuth,
  },
  validate: async ({ auth }) => {
    try {
      // This endpoint lists space users, a simple way to validate the token.
      await respondIoApiCall({
        method: HttpMethod.GET,
        url: '/space/user',
        auth: auth.token,
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

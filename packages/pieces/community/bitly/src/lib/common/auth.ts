import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bitlyApiCall, BitlyApiError } from './client';

export const bitlyAuth = PieceAuth.CustomAuth({
  description: `
  To get your Access Token:
  1. Log in to your Bitly account.
  2. Click your profile icon in the top right corner.
  3. Go to **Profile Settings**.
  4. Navigate to the **Developer settings** section.
  5. Click on **API**.
  6. Click the **Generate token** button and enter your password to get your access token.
  `,
  props: {
    accessToken: PieceAuth.SecretText({
      displayName: 'Access Token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await bitlyApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/user',
        operation: 'validate connection',
      });
      return { valid: true };
    } catch (e) {
      const invalid = e instanceof BitlyApiError && (e.statusCode === 401 || e.statusCode === 403);
      return {
        valid: false,
        error: invalid ? 'Invalid Access Token' : e instanceof Error ? e.message : 'Could not reach Bitly',
      };
    }
  },
  required: true,
});

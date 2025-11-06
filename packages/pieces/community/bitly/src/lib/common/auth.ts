import { PieceAuth } from '@activepieces/pieces-framework';
import { bitlyApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

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
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Access Token',
      };
    }
  },
  required: true,
});

import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { PushbulletApiError, pushbulletApi } from './client';

const authHelpDescription = `
1. Log in to your Pushbullet account.
2. Go to **https://www.pushbullet.com/#settings/account**.
3. Click **Create Access Token**, copy the token and paste it here.`;

export const bushbulletAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: authHelpDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await pushbulletApi.request({
        token: auth,
        method: HttpMethod.GET,
        path: '/users/me',
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof PushbulletApiError && (error.status === 401 || error.status === 403)) {
        return {
          valid: false,
          error: 'Invalid access token. Create a new token in Pushbullet Settings > Account and try again.',
        };
      }
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Could not verify the access token.',
      };
    }
  },
});

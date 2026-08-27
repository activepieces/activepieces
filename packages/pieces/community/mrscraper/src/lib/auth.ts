import { PieceAuth } from '@activepieces/pieces-framework';
import { mrscraperApi } from './common/http';

export const mrscraperAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description:
    'Sign in to the [MrScraper app](https://app.mrscraper.com), create or copy an API token from your account, and paste it here.',
  required: true,
  validate: async ({ auth }) => {
    const result = await mrscraperApi.validateToken({ token: auth });
    return result.valid
      ? { valid: true }
      : { valid: false, error: 'The API token could not be validated. Check the token and try again.' };
  },
});

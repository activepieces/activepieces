import { PieceAuth } from '@activepieces/pieces-framework';
import { dripApi } from './common/client';

export const dripAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Drip API token. In Drip go to Settings → User Settings → API Token (https://www.getdrip.com/user/edit) and copy the token.',
  validate: async ({ auth }) => {
    try {
      const accounts = await dripApi.listAccounts(auth);
      if (accounts.length === 0) {
        return { valid: false, error: 'This Drip API token has no accounts.' };
      }
      return { valid: true };
    } catch (error) {
      const status = dripApi.statusOf(error);
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid Drip API token. Copy it again from Settings → User Settings → API Token.' };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { valid: false, error: `Could not check the token with Drip: ${message.slice(0, 300)}` };
    }
  },
});

import { PieceAuth } from '@activepieces/pieces-framework';
import { removeAcApi } from './client';

export const removeAcAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Sign in at https://remove.ac, open My Account, and generate an API key starting with rac_live_.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await removeAcApi.getAccountCredits(auth);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Could not verify your remove.ac API key.',
      };
    }
  },
});

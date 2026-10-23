import { AppConnectionType, PieceAuth } from '@activepieces/pieces-framework';
import { scrapelessApi } from './common/api';

export const scrapelessApiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can obtain your API key from [Dashboard](https://app.scrapeless.com).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await scrapelessApi.getMe({
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
      });

      return {
        valid: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('timeout')) {
        return {
          valid: false,
          error: 'API validation timed out. Please check your network connection and try again.',
        };
      }

      if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
        return {
          valid: false,
          error: 'Network error occurred. Please check your internet connection.',
        };
      }

      return {
        valid: false,
        error: `API key validation failed: ${errorMessage}`,
      };
    }
  },
});

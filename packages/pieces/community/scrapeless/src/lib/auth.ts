import { PieceAuth } from '@activepieces/pieces-framework';
import { ScrapelessValidator } from './utils/validator';

export const scrapelessApiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can obtain your API key from [Dashboard](https://app.scrapeless.com).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      // Validate API key format first
      const formatValidation = await ScrapelessValidator.validateApiKey(auth);
      if (!formatValidation.isValid) {
        return {
          valid: false,
          error: `${formatValidation.errors.join(', ')}`,
        };
      }

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

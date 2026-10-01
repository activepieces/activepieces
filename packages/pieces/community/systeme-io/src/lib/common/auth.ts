import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { apiErrorStatus, systemeIoCommon } from './client';

export const systemeIoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Systeme.io API key. In your Systeme.io dashboard open Profile > **MCP & API keys** (systeme.io/dashboard/profile/public-api-settings), create a key and paste it here.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await systemeIoCommon.apiCall({
        method: HttpMethod.GET,
        url: '/tags',
        auth: { apiKey: auth },
      });
      
      return {
        valid: true,
        message: 'API key validated successfully. Connected to Systeme.io.'
      };
    } catch (error: unknown) {
      const status = apiErrorStatus(error);
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your API key and try again.',
        };
      }
      
      const message = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        error: `Authentication failed: ${message.replace(/[.!?]+\s*$/, '')}. Please verify your API key is correct.`,
      };
    }
  },
});

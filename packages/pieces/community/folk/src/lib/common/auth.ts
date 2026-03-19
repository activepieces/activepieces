import { PieceAuth } from '@activepieces/pieces-framework';
import { folkClient } from './client';
import { AppConnectionType } from '@activepieces/shared';

export const folkAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Folk API key. You can view and manage your API keys in your workspace settings under the "API" section at https://app.folk.app/apps/contacts/network/settings/api-keys',
  required: true,
  validate: async ({ auth }) => {
    try {
      await folkClient.testConnection({
        secret_text: auth,
        type: AppConnectionType.SECRET_TEXT,
      });

      return {
        valid: true,
        message: 'API key validated successfully. Connected to Folk.',
      };
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('403')) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your API key and try again.',
        };
      }

      return {
        valid: false,
        error: `Authentication failed: ${error.message}. Please verify your API key is correct.`,
      };
    }
  },
});

export type FolkAuthType = string;

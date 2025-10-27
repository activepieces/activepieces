import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { folkClient } from './client';

export const folkAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Folk API key. You can find this in your Folk account settings under API.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await folkClient.testConnection(auth as string);
      
      return {
        valid: true,
        message: 'API key validated successfully. Connected to Folk.'
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


import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { DocuMergeClient } from './client';

export const documergeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Get your API token from your dashboard by clicking API Tokens in the top right corner of your profile.',
  required: true,
  validate: async ({ auth }) => {
    if (!auth || typeof auth !== 'string') {
      return {
        valid: false,
        error: 'Please provide a valid API key.',
      };
    }

    const client = new DocuMergeClient(auth);
    try {
      await client.get('/api/documents');

      return {
        valid: true,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.message || 'Unknown error occurred';

      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Invalid API key. Please verify the key in your DocuMerge dashboard and try again.',
        };
      }

      return {
        valid: false,
        error: `Authentication failed: ${message}`,
      };
    }
  },
});


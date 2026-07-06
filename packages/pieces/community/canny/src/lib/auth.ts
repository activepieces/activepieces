import { PieceAuth } from '@activepieces/pieces-framework';

import { cannyRequest } from './common/client';

export const cannyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Canny secret API key. Find it at Settings → API in your Canny admin dashboard.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await cannyRequest<{
        boards?: Array<{ id: string }>;
      }>({
        apiKey: auth,
        path: '/boards/list',
      });

      if (Array.isArray(response.boards)) {
        return { valid: true };
      }

      return {
        valid: false,
        error: 'Unexpected response from Canny API. Check your API key.',
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or could not reach the Canny API.',
      };
    }
  },
});

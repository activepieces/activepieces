import { PieceAuth } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { baseUrl, unauthorizedMessage } from './common/common';

export const avianAuth = PieceAuth.SecretText({
  description: `
      Follow these instructions to get your Avian API Key:

1. Visit https://avian.io and sign up for an account.
2. Navigate to the API Keys section of your dashboard.
3. Create a new API key and copy it.`,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      const openai = new OpenAI({
        baseURL: baseUrl,
        apiKey: auth.auth,
      });

      const models = await openai.models.list();
      if (models.data.length > 0) {
        return {
          valid: true,
        };
      }
      return {
        valid: false,
        error: unauthorizedMessage,
      };
    } catch (e) {
      return {
        valid: false,
        error: unauthorizedMessage,
      };
    }
  },
});

import { PieceAuth } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { baseUrl, unauthorizedMessage } from './common/common';

export const minimaxAuth = PieceAuth.SecretText({
  description: `
  Follow these instructions to get your MiniMax API Key:

1. Visit https://platform.minimax.io and sign up for an account.
2. Navigate to the API Keys section to create and copy your API key.`,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      const openai = new OpenAI({
        baseURL: baseUrl,
        apiKey: auth.auth,
      });

      const response = await openai.chat.completions.create({
        model: 'MiniMax-M2.5-highspeed',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
      });
      if (response.choices.length > 0) {
        return {
          valid: true,
        };
      } else {
        return {
          valid: false,
          error: unauthorizedMessage,
        };
      }
    } catch (e) {
      return {
        valid: false,
        error: unauthorizedMessage,
      };
    }
  },
});

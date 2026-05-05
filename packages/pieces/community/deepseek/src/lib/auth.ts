import { PieceAuth, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { baseUrl, unauthorizedMessage } from './common/common';

export const deepseekAuth = PieceAuth.CustomAuth({
  description: `**API Key** — Follow these instructions to get your DeepSeek API Key:

1. Visit: https://platform.deepseek.com/api_keys
2. Click 'Create new secret key'.

**Base URL (optional)** — Leave blank to use the official DeepSeek API (https://api.deepseek.com). Set this to point to any DeepSeek-compatible proxy.`,
  required: true,
  fields: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL (optional)',
      description: 'Leave blank to use the official DeepSeek API.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    const url = (auth.baseUrl?.trim() || baseUrl).replace(/\/$/, '');
    try {
      const openai = new OpenAI({
        baseURL: url,
        apiKey: auth.apiKey,
      });

      const models = await openai.models.list();
      if (models.data.length > 0) {
        return {
          valid: true,
        };
      } else
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

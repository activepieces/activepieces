import { PieceAuth } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { baseUrl, unauthorizedMessage } from './common/common';

export const deepseekAuth = PieceAuth.SecretText({
      description:`
      Follow these instructions to get your DeepSeek API Key:

1. Visit the following website: https://platform.deepseek.com/api_keys.
2. Once on the website, locate and click on the option to obtain your DeepSeek API Key.`,
      displayName: 'API Key',
      required: true,
      validate: async (auth) => {
        try {
          const openai = new OpenAI({
            baseURL: baseUrl,
            apiKey: auth.auth,
          });

          const models = await openai.models.list();
          if (models.data.length > 0){
            return {
              valid: true,
            };
          }
          else
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

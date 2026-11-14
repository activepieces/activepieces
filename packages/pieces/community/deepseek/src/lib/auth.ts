import { PieceAuth } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { baseUrl, unauthorizedMessage } from './common/common';

export const deepseekAuth = PieceAuth.SecretText({
      description: `To get your API key:
1. Sign in at [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys).
2. Click **Create new API key**, name it, and copy the key (it starts with \`sk-\`).`,
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

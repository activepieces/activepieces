import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { SUPPORTED_AI_PROVIDERS } from '@activepieces/common-ai';

export const grokAuth = PieceAuth.SecretText({
  description: 
    SUPPORTED_AI_PROVIDERS.find(p => p.provider === 'grok')?.markdown || `
**Get your xAI API Key**

1. Sign up at [xAI](https://x.ai)
2. Go to your [API dashboard](https://console.x.ai)
3. Generate a new API key
4. Copy and paste the key here

Your API key should start with \`xai-\`
  `,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: 'https://api.x.ai/v1/models',
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth as string,
        },
      });
      return {
        valid: true,
      };
    } catch (e: any) {
      if (e.response?.status === 429) {
        return {
          valid: false,
          error: 'Your xAI account has run out of credits or reached its spending limit. Please add more credits at console.x.ai or raise your spending limit.',
        };
      }
      if (e.response?.status === 401) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your xAI API key and try again.',
        };
      }
      return {
        valid: false,
        error: 'Unable to validate API key. Please check your key and account status at console.x.ai.',
      };
    }
  },
}); 
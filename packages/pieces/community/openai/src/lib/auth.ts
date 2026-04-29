import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { DEFAULT_BASE_URL } from './common/common';

export const openaiAuth = PieceAuth.CustomAuth({
  description: `**API Key** — Follow these instructions to get your OpenAI API Key:

1. Visit: https://platform.openai.com/account/api-keys
2. Click 'Create new secret key'.

It is strongly recommended that you add billing information to your OpenAI account **before** generating the key. This prevents 429 errors.

**Base URL (optional)** — Leave blank to use the official OpenAI API. Set this to use a compatible self-hosted server such as llama-cpp, Ollama, LM Studio, or any OpenAI-compatible proxy (e.g. \`http://localhost:11434/v1\`).`,
  required: true,
  fields: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL (optional)',
      description:
        'Leave blank to use the official OpenAI API (https://api.openai.com/v1). Set this to point to any OpenAI-compatible server.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    const url = (auth.baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '');
    try {
      await httpClient.sendRequest<{ data: { id: string }[] }>({
        url: `${url}/models`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.apiKey,
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error:
          'Could not validate credentials. Check your API key and Base URL.',
      };
    }
  },
});

/** Type helper so actions can access auth fields with full type safety. */
export type OpenAIAuth = {
  apiKey: string;
  baseUrl?: string;
};

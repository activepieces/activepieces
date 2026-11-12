import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { LetmepostApiError, letmepostClient } from './client';

async function validateConnection({ baseUrlInput, apiKeyInput }: { baseUrlInput: unknown; apiKeyInput: unknown }): Promise<{ valid: true } | { valid: false; error: string }> {
  const checked = letmepostClient.checkBaseUrl(baseUrlInput);
  if (!checked.ok) {
    return { valid: false, error: checked.error };
  }
  const apiKey = letmepostClient.optionalText(apiKeyInput);
  if (apiKey === undefined) {
    return { valid: false, error: 'Enter your letmepost API key.' };
  }
  try {
    await letmepostClient.send<unknown>({
      baseUrl: checked.baseUrl,
      apiKey,
      method: HttpMethod.GET,
      path: '/v1/accounts',
      operation: 'list accounts to check the connection',
    });
    return { valid: true };
  } catch (error) {
    if (error instanceof LetmepostApiError) {
      if (error.status === 401) {
        return {
          valid: false,
          error: `letmepost rejected the API key (unauthenticated). Check that you copied the whole key (lmp_live_… or lmp_test_…) and that it was not revoked in the dashboard under API keys. ${error.message}`,
        };
      }
      return { valid: false, error: error.message };
    }
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, error: reason };
  }
}

export const letmepostAuth = PieceAuth.CustomAuth({
  displayName: 'letmepost Connection',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description:
        'The API base URL. Use `https://api.letmepost.dev` for the hosted service, or your own origin when self-hosting.',
      required: true,
      defaultValue: 'https://api.letmepost.dev',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: `Your letmepost API key (\`lmp_live_…\` or \`lmp_test_…\`). Create one in the dashboard under API keys.`,
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    return validateConnection({ baseUrlInput: auth.base_url, apiKeyInput: auth.api_key });
  },
});

export type LetmepostAuth = {
  props: {
    base_url?: string;
    api_key: string;
  };
};

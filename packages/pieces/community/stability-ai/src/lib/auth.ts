import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { StabilityAiError, stabilityClient } from './common/client';

async function validateApiKey(apiKey: string | undefined): Promise<{ valid: true } | { valid: false; error: string }> {
  const key = apiKey?.trim() ?? '';
  if (key.length === 0) {
    return { valid: false, error: 'Enter your Stability AI API key.' };
  }
  try {
    await stabilityClient.sendJson({ apiKey: key, method: HttpMethod.GET, path: '/v1/user/balance' });
    return { valid: true };
  } catch (error) {
    if (error instanceof StabilityAiError && error.status === 401) {
      return { valid: false, error: `Stability AI rejected the API key. ${error.message}` };
    }
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, error: `Could not verify the API key. ${reason}` };
  }
}

export const stabilityAiAuth = PieceAuth.CustomAuth({
  description: 'Create or copy an API key at https://platform.stability.ai/account/keys.',
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  required: true,
  validate: async ({ auth }) => validateApiKey(auth.api_key),
});

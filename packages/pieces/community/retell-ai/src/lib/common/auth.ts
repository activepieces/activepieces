import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { retellApiCall, toRetellError } from './client';

export const retellAiAuth = PieceAuth.CustomAuth({
  description: `
  To get your Retell AI API key:

  1. Log in to your Retell AI dashboard.
  2. Open **Settings > API Keys**.
  3. Copy an existing key or create a new one.
  4. To use the webhook triggers, use the key marked with the **webhook** badge: Retell signs webhooks with that key only.`,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Retell AI API Key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await retellApiCall({
        apiKey: auth.apiKey.trim(),
        method: HttpMethod.POST,
        path: '/v2/list-agents',
        query: { limit: 1 },
        body: {},
      });
      return { valid: true };
    } catch (error) {
      const retellError = toRetellError(error);
      if (retellError !== undefined && (retellError.status === 401 || retellError.status === 403)) {
        return { valid: false, error: 'Invalid API Key: Retell AI rejected it.' };
      }
      return {
        valid: false,
        error: `Could not verify the API key with Retell AI: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  required: true,
});

import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexClient } from './client';
import { rendexInput } from './common';

async function validateApiKey({ input }: { input: unknown }): Promise<{ valid: true } | { valid: false; error: string }> {
  const apiKey = rendexInput.optionalText(input);
  if (apiKey === undefined) {
    return { valid: false, error: 'Enter your Rendex API key (it starts with rdx_).' };
  }
  try {
    await rendexClient.send({
      apiKey,
      method: HttpMethod.GET,
      path: '/v1/account',
      operation: 'read your account to check the API key',
    });
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export const rendexAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Rendex API key (it starts with rdx_). Sign in at rendex.dev, open the dashboard and copy a key under API Keys. The free plan includes 100 renders per month.',
  required: true,
  validate: async ({ auth }) => validateApiKey({ input: auth }),
});

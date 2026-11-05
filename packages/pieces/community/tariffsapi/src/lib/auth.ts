import { PieceAuth } from '@activepieces/pieces-framework';
import { apiKeyOf, tariffsApiGet } from './common/client';

export const tariffsApiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Copy your API key from your [Tariffs API dashboard](https://tariffsapi.com).',
  validate: async ({ auth }) => {
    try {
      await tariffsApiGet({ apiKey: apiKeyOf(auth), path: '/tariffs/by_hts/0101.21.00' });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key, or the key could not be checked.' };
    }
  },
});

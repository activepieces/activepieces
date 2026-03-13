import { PieceAuth } from '@activepieces/pieces-framework';
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';

export const KAPSO_BASE_URL = 'https://api.kapso.ai/meta/whatsapp';

export const kapsoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Kapso API key. You can obtain it from your [Kapso dashboard](https://app.kapso.ai).',
  required: true,
  validate: async ({ auth }) => {
    try {
      const client = makeClient(auth);
      await client.phoneNumbers.settings.get({
        phoneNumberId: 'me',
      });

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});

export function makeClient(apiKey: string): WhatsAppClient {
  return new WhatsAppClient({
    baseUrl: KAPSO_BASE_URL,
    kapsoApiKey: apiKey,
  });
}

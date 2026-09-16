import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { createGoodmemClient } from './client';

export const goodmemAuth = PieceAuth.CustomAuth({
  displayName: 'GoodMem Authentication',
  description: 'Connect to your GoodMem server.',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description:
        'The URL of your GoodMem server, reachable from your Activepieces worker.',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your GoodMem API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await createGoodmemClient(auth).spaces.list({ maxResults: 1 });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to connect to GoodMem.',
      };
    }
  },
  required: true,
});

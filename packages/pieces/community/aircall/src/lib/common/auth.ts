import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeClient } from './client';

const authGuide = `
To obtain your Aircall API token, follow these steps:

1. Log in to your Aircall account.
2. Navigate to **Settings->Developer** section.
3. Generate your API token.
`;

export const aircallAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    apiToken: Property.ShortText({
      displayName: 'API Token',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Aircall API base URL (default: https://api.aircall.io/v1)',
      required: false,
      defaultValue: 'https://api.aircall.io/v1',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient({
        apiToken: auth.apiToken,
        baseUrl: auth.baseUrl || 'https://api.aircall.io/v1',
      });
      await client.authenticate();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API credentials',
      };
    }
  },
}); 
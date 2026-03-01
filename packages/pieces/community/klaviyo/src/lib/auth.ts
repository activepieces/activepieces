import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeClient } from './common';

const authGuide = `
To obtain your Klaviyo Private API Key, follow these steps:

1. Log in to your Klaviyo account.
2. Navigate to **Settings** -> **API Keys**.
3. Create a new **Private API Key** or use an existing one.
`;

export const klaviyoAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    apiKey: Property.ShortText({
      displayName: 'Private API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient(auth);
      await client.listLists();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});

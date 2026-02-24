import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { makeClient } from './common';

const authGuide = `
To obtain your Tarvent Account ID and API Key, follow these steps:

1. Log in to your Tarvent account.
2. Go to **Account->API Keys** section.
3. **Create an API key** and copy it. Make sure to give it the correct permissions.
4. The **Account ID** is available to copy at the top right
`;

export const tarventAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient({
        props:auth,
        type: AppConnectionType.CUSTOM_AUTH,
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

import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeClient } from './common';

const authGuide = `
To obtain your ActiveCampaign API URL and Key, follow these steps:

1. Log in to your ActiveCampaign account.
2. Navigate to **Settings->Developer** section.
3. Under **API Access** ,you'll find your API URL and Key.
`;

export const activeCampaignAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    apiUrl: Property.ShortText({
      displayName: 'API URL',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient(auth);
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

import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const instantlyAuth = PieceAuth.CustomAuth({
  description: `
    To authenticate with Instantly.ai:
    1. Log in to your Instantly account.
    2. Go to 'Settings' > 'Integrations'.
    3. Copy your API Key.
  `,
  required: true,
  props: {
    apiKey: Property.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});

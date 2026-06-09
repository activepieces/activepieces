import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const aipriseAuth = PieceAuth.CustomAuth({
  displayName: 'API Key',
  description: `To get your AiPrise API key:
1. Log in to your [AiPrise dashboard](https://app.aiprise.com)
2. Go to **Settings > API Keys**
3. Copy your API key and paste it here
`,
  required: true,
  props: {
    secret_text: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your AiPrise API key',
      required: true,
    }),
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Select the AiPrise environment to use',
      required: true,
      options: {
        options: [
          { label: 'Production', value: 'production' },
          { label: 'Sandbox', value: 'sandbox' },
        ],
      },
    }),
  },
});

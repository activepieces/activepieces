import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const murftAuth = PieceAuth.CustomAuth({
  description: `To obtain your Murf API key:
  1. Sign in to your Murf account
  2. Navigate to API settings
  3. Generate a new API key`,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Murf API Key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The Murf API base URL',
      defaultValue: 'https://api.murf.ai/v1',
      required: true,
    }),
  },
  required: true,
});
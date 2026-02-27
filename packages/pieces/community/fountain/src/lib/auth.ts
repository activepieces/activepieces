import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const API_BASE_URL_DEFAULT = 'https://api.fountain.com';

export const fountainAuth = PieceAuth.CustomAuth({
  description: 'Enter your Fountain API key and base URL',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Enter your Fountain API key from Profile > Manage API Keys or Settings > Integrations & API Keys',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: `The base URL for your Fountain API (default: ${API_BASE_URL_DEFAULT}). For example: us-2.fountain.com/api/v2`,
      required: false,
    }),
  },
});

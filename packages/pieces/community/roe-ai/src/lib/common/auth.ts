import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const roeAiAuth = PieceAuth.CustomAuth({
  displayName: 'Roe AI Auth',
  description: 'Authenticate with Roe AI using your API key',
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Enter your Roe AI API key',
      required: true,
    }),
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Enter your Roe AI Organization ID',
      required: true,
    }),
  },
  required: true,
});

import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const fiservAuth = PieceAuth.CustomAuth({
  description: 'Fiserv Banking API credentials',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the Fiserv API (e.g., https://api.fiservapps.com)',
      required: true,
    }),
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Your Fiserv organization/institution ID',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Fiserv API key',
      required: true,
    }),
  },
});

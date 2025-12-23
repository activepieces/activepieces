import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const icemortgageEncompassAuth = PieceAuth.CustomAuth({
  description: 'ICE Mortgage Technology Encompass API credentials',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'API Base URL',
      description: 'The base URL for the Encompass API (e.g., https://api.elliemae.com)',
      required: true,
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Your Encompass API Client ID',
      required: true,
    }),
    clientSecret: Property.ShortText({
      displayName: 'Client Secret',
      description: 'Your Encompass API Client Secret',
      required: true,
    }),
    instanceId: Property.ShortText({
      displayName: 'Instance ID',
      description: 'Your Encompass Instance ID',
      required: true,
    }),
  },
});
